# Sohni UI

A React Native component library for creating beautiful user interfaces.

## Installation

```bash
npm install sohni-ui
```

## Components

### Toast

A flexible toast notification system with multiple types and configurations.

#### Setup

Wrap your application with the `ToastProvider`:

```tsx
import { ToastProvider } from 'sohni-ui';

export default function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  );
}
```

#### Basic Usage

```tsx
import { useToast } from 'sohni-ui';

function MyComponent() {
  const toast = useToast();

  const showBasicToast = () => {
    toast.showToast({
      message: 'Hello World!',
      duration: 3000,
    });
  };

  return <Button title="Show Toast" onPress={showBasicToast} />;
}
```

#### Toast Types

```tsx
function ToastExamples() {
  const toast = useToast();

  return (
    <>
      <Button
        title="Success"
        onPress={() => toast.success('Operation completed!')}
      />
      <Button
        title="Error"
        onPress={() => toast.error('Something went wrong')}
      />
      <Button title="Info" onPress={() => toast.info('Did you know?')} />
      <Button title="Warning" onPress={() => toast.warning('Be careful!')} />
      <Button title="Loading" onPress={() => toast.loading('Processing...')} />
    </>
  );
}
```

#### Promise Toast

Automatically show loading, success, and error states for async operations:

```tsx
function PromiseExample() {
  const toast = useToast();

  const handleAsyncOperation = () => {
    const fetchData = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { success: true };
    };

    toast.promise(fetchData(), {
      pendingMessage: 'Loading data...',
      successMessage: 'Data loaded successfully!',
      errorMessage: 'Failed to load data',
    });
  };

  return <Button title="Fetch Data" onPress={handleAsyncOperation} />;
}
```

#### Toast Configuration

Customize your toasts with various options:

```tsx
toast.showToast({
  message: 'Custom Toast',
  description: 'With more details',
  type: 'info',
  position: 'top', // 'top', 'bottom', or 'center'
  theme: 'light', // 'light', 'dark', 'colored', or 'system'
  duration: 5000,
  closable: true,
  progress: true,
  // Additional styling options
  containerStyle: { borderWidth: 1 },
  textStyle: { fontWeight: 'bold' },
  descriptionStyle: { fontStyle: 'italic' },
});
```

## License

MIT
