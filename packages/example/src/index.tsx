import ReactDOM from 'react-dom';

function App() {
  return <span>foobar</span>;
}

const container = document.createElement('div');
document.body.append(container);

ReactDOM.render(<App />, container);
