import ReactDOM from 'react-dom';

import 'tailwindcss/base.css';
import 'tailwindcss/utilities.css';
import { FormBinding } from './examples/FormBinding';
import { InteractionForm } from './examples/InteractionForm';
import { LoginForm } from './examples/LoginForm';

import { type ReactNode, useState } from 'react';

import { SubForm } from './examples/SubForm';

interface Story {
  id: string;
  label: string;
  component: ReactNode;
}

const stories: Story[] = [
  { id: 'login', label: 'LoginForm', component: <LoginForm /> },
  { id: 'interaction', label: 'Interaction', component: <InteractionForm /> },
  { id: 'subform', label: 'SubForm', component: <SubForm /> },
  { id: 'form-binding', label: 'FormBinding', component: <FormBinding /> },
];

function App() {
  const [currentStory, setCurrentStory] = useState<Story>(stories[0]);
  return (
    <div className="h-screen flex flex-col">
      <div>
        <select
          value={currentStory.id}
          onChange={(e) => setCurrentStory(stories.find((s) => s.id === e.target.value)!)}
        >
          {stories.map((story) => (
            <option key={story.id} value={story.id}>
              {story.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-center flex-1 min-h-0 w-screen bg-neutral-50">
        {currentStory.component}
      </div>
    </div>
  );
}

const container = document.createElement('div');
document.body.append(container);

ReactDOM.render(<App />, container);
