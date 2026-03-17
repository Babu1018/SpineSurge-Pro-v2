import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    // -------------------------------------------------------------------------
    // Main Process Configuration
    // -------------------------------------------------------------------------
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'out/main',
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/main/index.ts'),
                },
            },
        },
    },

    // -------------------------------------------------------------------------
    // Preload Script Configuration
    // -------------------------------------------------------------------------
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'out/preload',
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/preload/index.ts'),
                },
            },
        },
    },

    // -------------------------------------------------------------------------
    // Renderer Process Configuration (React + VTK.js + Cornerstone.js)
    // -------------------------------------------------------------------------
    renderer: {
        root: resolve(__dirname, 'src/renderer'),
        publicDir: resolve(__dirname, 'public'),
        plugins: [react()],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src/renderer'),
            },
        },
        build: {
            outDir: resolve(__dirname, 'out/renderer'),
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/renderer/index.html'),
                },
                output: {
                    manualChunks: {
                        'vtk': ['@kitware/vtk.js'],
                        'cornerstone': [
                            '@cornerstonejs/core',
                            '@cornerstonejs/tools',
                            '@cornerstonejs/dicom-image-loader'
                        ],
                        'vendor': ['react', 'react-dom', 'react-router-dom', 'zustand']
                    }
                }
            },
            chunkSizeWarningLimit: 2000,
            assetsInlineLimit: 0, // Don't inline workers or WASM
        },
        // -----------------------------------------------------------------------
        // VTK.js & Cornerstone.js Specific Configuration
        // -----------------------------------------------------------------------
        optimizeDeps: {
            exclude: ['@cornerstonejs/dicom-image-loader'],
            include: [
                'dicom-parser',
                'hammerjs',
                'globalthis',
                '@cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs',
                '@cornerstonejs/codec-charls/decodewasmjs',
                '@cornerstonejs/codec-openjpeg/decodewasmjs',
                '@cornerstonejs/codec-openjph/wasmjs',
            ],
        },
        worker: {
            format: 'es',
        },
        define: {
            'process.env': {},
        },
        server: {
            // Required for SharedArrayBuffer (Cornerstone.js codecs)
            headers: {
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp',
            },
        },
        // -----------------------------------------------------------------------
        // Asset Handling for DICOM and Medical Imaging
        // -----------------------------------------------------------------------
        assetsInclude: [
            '**/*.dcm',      // DICOM files
            '**/*.nii',      // NIfTI files
            '**/*.nii.gz',   // Compressed NIfTI
            '**/*.stl',      // 3D mesh files
            '**/*.vtk',      // VTK files
            '**/*.vtp',      // VTK PolyData
            '**/*.obj',      // OBJ mesh files
            '**/*.gltf',     // glTF 3D models
            '**/*.glb',      // glTF binary
        ],
    },
});
