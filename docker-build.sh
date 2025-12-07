#!/bin/bash

# NovaGraph Docker Build Script
# Interactive script to select Kuzu database mode and build/run with Docker

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display the mode selection menu
show_menu() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     NovaGraph - Kuzu Database Mode Selection          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please select the Kuzu database mode:"
    echo ""
    echo "  1. inmemory sync    - In-memory database with synchronous operations"
    echo "  2. inmemory async   - In-memory database with asynchronous operations"
    echo "  3. persistent sync  - Persistent database with synchronous operations"
    echo -e "  4. persistent async - Persistent database with asynchronous operations ${GREEN}(default)${NC}"
    echo ""
}

# Function to parse mode selection
parse_mode() {
    local mode=$1
    case $mode in
        1)
            KUZU_TYPE="inmemory"
            KUZU_MODE="sync"
            ;;
        2)
            KUZU_TYPE="inmemory"
            KUZU_MODE="async"
            ;;
        3)
            KUZU_TYPE="persistent"
            KUZU_MODE="sync"
            ;;
        4)
            KUZU_TYPE="persistent"
            KUZU_MODE="async"
            ;;
        *)
            echo -e "${RED}Invalid selection. Please choose 1-4.${NC}"
            exit 1
            ;;
    esac
}

# Function to parse service selection
parse_service() {
    local service=$1
    case $service in
        1)
            SERVICE="novagraph-dev"
            ;;
        2)
            SERVICE="novagraph-prod"
            ;;
        *)
            echo -e "${RED}Invalid selection. Please choose 1 or 2.${NC}"
            exit 1
            ;;
    esac
}

# Function to parse action selection
parse_action() {
    local action=$1
    case $action in
        1)
            ACTION="build"
            ACTION_DISPLAY="build & run"
            ;;
        2)
            ACTION="run"
            ACTION_DISPLAY="run only"
            ;;
        3)
            ACTION="rebuild"
            ACTION_DISPLAY="rebuild & run"
            ;;
        *)
            echo -e "${RED}Invalid selection. Please choose 1, 2, or 3.${NC}"
            exit 1
            ;;
    esac
}

# Main script logic - Always show interactive menu
show_menu
echo -n "Enter your choice [1-4] (default: 4): "
read -r user_input

if [ -z "$user_input" ]; then
    MODE=4
else
    MODE=$user_input
fi

echo ""
echo "Please select the service:"
echo ""
echo "  1. novagraph-dev   - Development server (port 5173)"
echo -e "  2. novagraph-prod  - Production server (port 3000) ${GREEN}(default)${NC}"
echo ""
echo -n "Enter your choice [1-2] (default: 2): "
read -r service_input

if [ -z "$service_input" ]; then
    SERVICE_NUM=2
else
    SERVICE_NUM=$service_input
fi

echo ""
echo "Please select the action:"
echo ""
echo "  1. build & run   - Build image and run (full process)"
echo -e "  2. run only      - Run container only (assumes image exists) ${GREEN}(default)${NC}"
echo "  3. rebuild & run  - Rebuild image without cache and run"
echo ""
echo -n "Enter your choice [1-3] (default: 2): "
read -r action_input

if [ -z "$action_input" ]; then
    ACTION_NUM=2
else
    ACTION_NUM=$action_input
fi

# Validate mode
if ! [[ "$MODE" =~ ^[1-4]$ ]]; then
    echo -e "${RED}Error: Mode must be 1, 2, 3, or 4${NC}"
    exit 1
fi

# Validate service
if ! [[ "$SERVICE_NUM" =~ ^[1-2]$ ]]; then
    echo -e "${RED}Error: Service must be 1 or 2${NC}"
    exit 1
fi

# Validate action
if ! [[ "$ACTION_NUM" =~ ^[1-3]$ ]]; then
    echo -e "${RED}Error: Action must be 1, 2, or 3${NC}"
    exit 1
fi

# Parse selections
parse_mode $MODE
parse_service $SERVICE_NUM
parse_action $ACTION_NUM

echo ""
echo -e "${GREEN}Configuration:${NC}"
echo "  Mode: ${KUZU_TYPE} ${KUZU_MODE}"
echo "  Service: ${SERVICE}"
echo "  Action: ${ACTION_DISPLAY}"
echo ""

# Execute Docker commands based on service and action
if [ "$SERVICE" == "novagraph-dev" ]; then
    # Development service
    case $ACTION in
        build)
            echo -e "${GREEN}Building ${SERVICE} image...${NC}"
            docker build -t ${SERVICE} --target development \
                --build-arg KUZU_TYPE=${KUZU_TYPE} \
                --build-arg KUZU_MODE=${KUZU_MODE} \
                .
            
            echo ""
            echo -e "${GREEN}Copying WASM files to local workspace...${NC}"
            docker run --rm -v $(pwd):/host ${SERVICE} cp ./src/graph.js ./src/graph.wasm ./src/graph.d.ts /host/src/
            
            echo ""
            echo -e "${GREEN}Starting ${SERVICE} container...${NC}"
            echo -e "${YELLOW}Your application will be available at http://localhost:5173${NC}"
            echo ""
            docker run -it --rm \
                -v $(pwd):/src \
                -w /src \
                -p 5173:5173 \
                -v /src/node_modules \
                -e NODE_ENV=development \
                -e KUZU_TYPE=${KUZU_TYPE} \
                -e VITE_KUZU_TYPE=${KUZU_TYPE} \
                -e KUZU_MODE=${KUZU_MODE} \
                -e VITE_KUZU_MODE=${KUZU_MODE} \
                ${SERVICE}
            ;;
        rebuild)
            echo -e "${GREEN}Rebuilding ${SERVICE} image (no cache)...${NC}"
            docker build -t ${SERVICE} --target development \
                --no-cache \
                --build-arg KUZU_TYPE=${KUZU_TYPE} \
                --build-arg KUZU_MODE=${KUZU_MODE} \
                .
            
            echo ""
            echo -e "${GREEN}Copying WASM files to local workspace...${NC}"
            docker run --rm -v $(pwd):/host ${SERVICE} cp ./src/graph.js ./src/graph.wasm ./src/graph.d.ts /host/src/
            
            echo ""
            echo -e "${GREEN}Starting ${SERVICE} container...${NC}"
            echo -e "${YELLOW}Your application will be available at http://localhost:5173${NC}"
            echo ""
            docker run -it --rm \
                -v $(pwd):/src \
                -w /src \
                -p 5173:5173 \
                -v /src/node_modules \
                -e NODE_ENV=development \
                -e KUZU_TYPE=${KUZU_TYPE} \
                -e VITE_KUZU_TYPE=${KUZU_TYPE} \
                -e KUZU_MODE=${KUZU_MODE} \
                -e VITE_KUZU_MODE=${KUZU_MODE} \
                ${SERVICE}
            ;;
        run)
            echo -e "${GREEN}Starting ${SERVICE} container...${NC}"
            echo -e "${YELLOW}Your application will be available at http://localhost:5173${NC}"
            echo ""
            docker run -it --rm \
                -v $(pwd):/src \
                -w /src \
                -p 5173:5173 \
                -v /src/node_modules \
                -e NODE_ENV=development \
                -e KUZU_TYPE=${KUZU_TYPE} \
                -e VITE_KUZU_TYPE=${KUZU_TYPE} \
                -e KUZU_MODE=${KUZU_MODE} \
                -e VITE_KUZU_MODE=${KUZU_MODE} \
                ${SERVICE}
            ;;
    esac
else
    # Production service
    case $ACTION in
        build)
            echo -e "${GREEN}Building ${SERVICE} image...${NC}"
            docker build -t ${SERVICE} --target production \
                --build-arg KUZU_TYPE=${KUZU_TYPE} \
                --build-arg KUZU_MODE=${KUZU_MODE} \
                .
            
            echo ""
            echo -e "${GREEN}Starting ${SERVICE} container...${NC}"
            echo -e "${YELLOW}Your application will be available at http://localhost:3000${NC}"
            echo ""
            docker run -it -p 3000:3000 ${SERVICE}
            ;;
        rebuild)
            echo -e "${GREEN}Rebuilding ${SERVICE} image (no cache)...${NC}"
            docker build -t ${SERVICE} --target production \
                --no-cache \
                --build-arg KUZU_TYPE=${KUZU_TYPE} \
                --build-arg KUZU_MODE=${KUZU_MODE} \
                .
            
            echo ""
            echo -e "${GREEN}Starting ${SERVICE} container...${NC}"
            echo -e "${YELLOW}Your application will be available at http://localhost:3000${NC}"
            echo ""
            docker run -it -p 3000:3000 ${SERVICE}
            ;;
        run)
            echo -e "${GREEN}Starting ${SERVICE} container...${NC}"
            echo -e "${YELLOW}Your application will be available at http://localhost:3000${NC}"
            echo ""
            docker run -it -p 3000:3000 ${SERVICE}
            ;;
    esac
fi
