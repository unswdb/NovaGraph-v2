# Contains C++ files and libraries

## igraph
NovaGraph uses the igraph C library for graph analytics and computations. To build, the igraph library needs to be built locally. The igraph library is not being tracked but can be built for WebAssembly with Emscripten and cmake installed:

```bash
cd src/wasm
git clone https://github.com/igraph/igraph.git
mkdir igraph/build
cd igraph/build
emcmake cmake ..
cmake --build .
```

One of the problems I ran into was the "TestEndianess" check. To fix this, I had to add the line `SET(CMAKE_16BIT_TYPE "unsigned short")` in the file "/usr/share/cmake-3.28/Modules/TestBigEndian.cmake".

Other problems may also pop up during the build which may require certain programs to be installed or small file modifications like the above to bypass. These will depend on what has been written in the library's `CMakeLists.txt` file.

## RapidJSON
Make sure the RapidJSON git repository is cloned.
```bash
git clone https://github.com/Tencent/rapidjson.git
```
This doesn't need CMake to use since its a header only library
