// global.d.ts
interface Window {
  Pusher: any; // You can specify the exact type if needed, but 'any' will work if you want flexibility
}

declare module '*.css';
declare module '*.scss';
declare module '*.sass';
