@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
  background-color: #f8fafc;
}

/* Safe area padding for mobile devices */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}
.pb-safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
