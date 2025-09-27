import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
    return <h1 className="text-3xl font-bold underline">Hello from React + Tailwind!</h1>;
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
