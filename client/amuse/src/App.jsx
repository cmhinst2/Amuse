import { BrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
function App() {

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // DB가 깨어나는 시간을 고려해 실패 시 3번까지 재시도합니다.
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Amuse 앱 배경색과 어울리는 로딩 처리를 위해 staleTime 조절
        staleTime: 1000 * 60 * 5,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout />
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: { background: '#1e293b', color: '#F1F5F9', border: '1px solid #334155' },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
