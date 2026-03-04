import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        regulamin: resolve(__dirname, 'regulamin.html'),
        'polityka-prywatnosci': resolve(__dirname, 'polityka-prywatnosci.html'),
      },
    },
  },
});
