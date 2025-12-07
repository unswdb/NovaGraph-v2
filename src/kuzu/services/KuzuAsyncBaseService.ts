import KuzuBaseService from "./KuzuBaseService";

interface WorkerMessage {
  id: number;
  type: string;
  data: unknown;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

type InitializedKuzuAsyncBaseService = KuzuAsyncBaseService & {
  worker: NonNullable<KuzuAsyncBaseService["worker"]>;
};

export default class KuzuAsyncBaseService extends KuzuBaseService {
  protected worker: Worker | null = null;
  protected messageId = 0;
  protected pendingRequests = new Map<number, PendingRequest>();
  private _initializationPromise: Promise<void> | null = null;

  constructor() {
    super();
  }

  protected failPendingRequests(message: string) {
    this.pendingRequests.forEach((request) =>
      request.reject(new Error(message))
    );
    this.pendingRequests.clear();
  }

  /**
   * Get the file system for this service
   * Note: In worker-based implementation, file system operations are proxied through the worker
   */
  protected getFileSystem() {
    // Since we're using a worker-based implementation, we don't have direct access to the file system
    // File system operations should be done through writeVirtualFile/deleteVirtualFile methods
    return null;
  }

  /**
   * Initialize the async in-memory database
   */
  protected async initialize(
    createWorker: () => Worker,
    initData: Record<string, unknown> = {}
  ) {
    if (this._initializationPromise) {
      return this._initializationPromise;
    }
    this._initializationPromise = this._doInitialize(createWorker, initData);
    return this._initializationPromise;
  }

  private async _doInitialize(createWorker: () => Worker) {
    try {
      // Create Web Worker
      this.worker = createWorker();

      this.worker.onmessage = (e) => {
        const { id, data, error } = e.data;
        const request = this.pendingRequests.get(id);

        if (request) {
          error ? request.reject(new Error(error)) : request.resolve(data);
          this.pendingRequests.delete(id);
        }
      };

      this.worker.onerror = (error) => {
        // Extract detailed error information
        const errorMessage = 
          error.message || 
          (error as any).filename || 
          (error as any).lineno || 
          (error as any).colno ||
          "Unknown error";
        
        const errorDetails = {
          message: errorMessage,
          filename: (error as any).filename,
          lineno: (error as any).lineno,
          colno: (error as any).colno,
          error: error.error || error,
        };
        
        console.error("Worker error:", errorDetails);
        
        // Create a more descriptive error message
        const errorMsg = errorMessage === "Unknown error" 
          ? `Worker error: ${JSON.stringify(errorDetails)}`
          : `Worker error: ${errorMessage}${errorDetails.filename ? ` (${errorDetails.filename}:${errorDetails.lineno})` : ''}`;
        
        this.pendingRequests.forEach((request) => {
          request.reject(new Error(errorMsg));
        });
        this.pendingRequests.clear();
      };

      this.worker.onmessageerror = (error) => {
        console.error("Worker message error:", error);
        const errorMsg = `Worker message channel error: ${error.message || "Failed to deserialize message"}`;
        this.pendingRequests.forEach((request) => {
          request.reject(new Error(errorMsg));
        });
        this.pendingRequests.clear();
      };

      // Initialize the worker
      await this.sendMessage("init", {});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to initialize worker:", errorMessage);
      throw new Error(`Failed to initialize worker: ${errorMessage}`);
    }
  }

  /**
   * Send a message to the worker and wait for response
   */
  protected async sendMessage<T = unknown>(
    type: string,
    data: Record<string, unknown>
  ): Promise<T> {
    if (this._initializationPromise) {
      await this._initializationPromise;
    }

    this.checkInitialization();

    return new Promise<T>((resolve, reject) => {
      const id = this.messageId++;
      this.pendingRequests.set(id, {
        resolve: (value: unknown) => resolve(value as T),
        reject,
      });
      this.worker.postMessage({ id, type, data } as WorkerMessage);

      // Set timeout for long-running operations
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Operation timeout: ${type}`));
        }
      }, 120000); // 120 second timeout for persistent operations
    });
  }

  protected checkInitialization(): asserts this is InitializedKuzuAsyncBaseService {
    if (!this.worker) {
      throw new Error("Database is not initialized");
    }
  }
}
