import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/store/api/baseApi';

// Importing the slices for their side effect: each one injects its endpoints
// into `baseApi`. Without these imports the hooks exist but the endpoints do not.
import '@/store/api/authApi';
import '@/store/api/batchApi';
import '@/store/api/classApi';
import '@/store/api/attendanceApi';
import '@/store/api/adminApi';

export const makeStore = () =>
  configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

export const store = makeStore();

// Refetch on reconnect, so a student whose wifi dropped mid-class sees fresh
// data the moment it comes back rather than a frozen page.
setupListeners(store.dispatch);

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
