import ReactDOM from 'react-dom';
import 'tailwindcss/base.css';
import 'tailwindcss/utilities.css';
import { LoginForm } from './examples/LoginForm';

function App() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-neutral-50">
      <LoginForm />
    </div>
  );
}

const container = document.createElement('div');
document.body.append(container);

ReactDOM.render(<App />, container);
