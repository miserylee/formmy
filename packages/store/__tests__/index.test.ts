import Store from '../src';

export async function waitForFlush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 10);
  });
}

describe('Store', () => {
  it('should get state as initial state', () => {
    const initialState = { foo: 'bar' };
    const store = new Store(initialState);
    expect(store.state).toBe(initialState);
  });
  it('should trigger update event as expected', async () => {
    const initialState = { foo: 'bar' };
    const store = new Store(initialState);
    const mockListener = vi.fn();
    const unsub = store.subscribe({
      listener: mockListener,
    });
    const nextValue = { foo: 'baz' };
    store.update(nextValue);
    await waitForFlush();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toBeCalledWith(nextValue);
    unsub();
  });
  it('should trigger immediate update event as expected', async () => {
    const initialState = { foo: 'bar' };
    const store = new Store(initialState);
    const mockListener = vi.fn();
    const unsub = store.subscribe({
      listener: mockListener,
      immediate: true,
    });
    const nextValue = { foo: 'baz' };
    store.update(nextValue);
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toBeCalledWith(nextValue);
    unsub();
  });
  it('should trigger update event with selector as expected', async () => {
    const initialState = { bar: 'a', baz: 'b' };
    const store = new Store(initialState);
    const mockListener = vi.fn();
    const unsub = store.subscribe({
      listener: mockListener,
      selector: (value) => value.bar,
    });
    store.update((prev) => {
      return {
        ...prev,
        baz: 'ccc',
      };
    });
    await waitForFlush();
    expect(mockListener).not.toBeCalled();
    store.update((prev) => {
      return {
        ...prev,
        bar: 'ddd',
      };
    });
    await waitForFlush();
    expect(mockListener).toBeCalledTimes(1);
    expect(mockListener).toBeCalledWith('ddd');
    unsub();
  });
  it('should trigger immediate update event with selector as expected when callback update another value again', async () => {
    const initialState = { bar: 'a', baz: 'b' };
    const store = new Store(initialState);
    const mockListener = vi.fn();
    const unsub = store.subscribe({
      selector: (value) => value.baz,
      listener: (v) => {
        store.update((prev) => {
          return {
            ...prev,
            bar: 'ddd',
          };
        });
        mockListener(v);
      },
      immediate: true,
    });
    store.update((prev) => {
      return {
        ...prev,
        baz: 'ccc',
      };
    });
    expect(mockListener).toBeCalledTimes(1);
    unsub();
  });
  it('should clear listeners as expected', async () => {
    const store = new Store({ foo: 'bar' });
    const mockListener = vi.fn();
    store.subscribe({
      listener: mockListener,
      immediate: true,
    });
    store.update({ foo: 'baz' });
    expect(mockListener).toBeCalledTimes(1);
    store.clear();
    mockListener.mockClear();
    store.update({ foo: 'baz' });
    expect(mockListener).not.toBeCalled();
  });
  it('should reset as expected', async () => {
    const store = new Store({ foo: 'bar' });
    store.update({
      foo: 'baz',
    });
    store.reset();
    expect(store.state.foo).toBe('bar');
  });
  it('should ignore reset update as expected', async () => {
    const store = new Store({ foo: 'bar' });
    const mockListener = vi.fn();
    store.subscribe({
      selector: (v) => v.foo,
      listener: mockListener,
      immediate: true,
      ignoreReset: true,
    });
    store.update({ foo: 'baz' });
    expect(mockListener).toBeCalled();
    store.reset();
    expect(mockListener).toBeCalledTimes(1);
  });
  it('should unsub listener as expected', async () => {
    const store = new Store({ foo: 'bar' });
    const mockListener = vi.fn();
    const unsub = store.subscribe({
      selector: (v) => v.foo,
      listener: mockListener,
      immediate: true,
    });
    store.update({ foo: 'baz' });
    expect(mockListener).toBeCalledTimes(1);
    unsub();
    mockListener.mockRestore();
    store.update({ foo: 'bbbbb' });
    expect(mockListener).not.toBeCalled();
  });
});
