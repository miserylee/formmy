import { FormApi } from '../src';

const delay = (ms: number = 100) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SubFormApi', () => {
  it('should create SubFormApi as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: 'a',
          b: 'b',
        },
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
      validators: {
        a: [(v) => (!v ? 'required' : undefined)],
      },
      interactions: [
        {
          deps: ['a'],
          action: (formApi1) => {
            formApi1.setValue('b', formApi1.getValue('a'));
          },
        },
      ],
    });
    expect(subFormApi.getValues()).toStrictEqual({
      a: 'a',
      b: 'b',
    });
    subFormApi.setValue('a', 'aaa');
    await delay();
    expect(subFormApi.getValues()).toStrictEqual({
      a: 'aaa',
      b: 'aaa',
    });
    subFormApi.setValue('a', '');
    await delay();
    expect(subFormApi.getValidationState('a').isValid).toBeFalsy();
  });
  it('should update validators as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: 'a',
          b: 'b',
        },
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
      validators: {
        a: [(v) => (!v ? 'required' : undefined)],
      },
    });
    // reset validators
    subFormApi.setValidators((prev) => {
      return {
        b: [(v) => (!v ? 'b is required' : undefined)],
      };
    });
    subFormApi.setValue('a', '');
    await delay();
    expect(subFormApi.getValidationStates()).toStrictEqual({
      errors: {},
      isValid: true,
      isValidating: false,
    });
    subFormApi.setValue('b', '');
    await delay();
    expect(subFormApi.getValidationStates()).toStrictEqual({
      errors: {
        b: {
          isValid: false,
          isValidating: false,
          message: 'b is required',
        },
      },
      isValid: false,
      isValidating: false,
    });

    // set validator from main form
    formApi.setValidators((prev) => {
      return {
        ...prev,
        'bar.a': [(v) => (!v ? 'required' : undefined)],
      };
    });
    await subFormApi.validate('a');
    expect(subFormApi.getValidationState('a')).toStrictEqual({
      isValid: false,
      isValidating: false,
      message: 'required',
    });

    // remove validator from sub form
    subFormApi.setValidators((prev) => {
      expect(prev.a).not.toBeNull();
      expect(prev.b).not.toBeNull();
      return {};
    });
    await subFormApi.validate('a');
    await subFormApi.validate('b');
    expect(subFormApi.getValidationState('a')).toStrictEqual({
      isValid: true,
      isValidating: false,
      message: undefined,
    });
  });
  it('should validate from dep key', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: '',
          b: 'b',
        },
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
      validators: {
        a: [
          {
            deps: ['b'],
            validate: (v) => (!v ? 'required' : undefined),
          },
        ],
      },
    });
    subFormApi.setValue('b', '');
    await delay();
    expect(formApi.getValidationState('bar.a').isValid).toBeFalsy();
    // set validator with deps from main form
    formApi.setValidators((prev) => ({
      ...prev,
      'bar.b': [
        {
          deps: ['bar.a'],
          validate: (v) => (!v ? 'required' : undefined),
        },
      ],
      foo: [(v) => (!v ? 'required' : undefined)],
    }));
    expect(subFormApi.getValidationState('b').isValid).toBeTruthy();
    subFormApi.setValue('a', '1');
    await delay();
    expect(subFormApi.getValidationState('b').isValid).toBeFalsy();
    subFormApi.setValidators((prev) => {
      expect([...(prev.b ?? [])].at(0)).toMatchObject({
        deps: ['a'],
      });
      return prev;
    });
    formApi.setValidators((prev) => {
      expect(prev.foo).not.toBeUndefined();
      return prev;
    });
  });
  it('should set values as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: 'a',
          b: 'b',
        },
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
    });
    subFormApi.setValues({
      a: '1',
      b: '2',
    });
    expect(formApi.getValues()).toStrictEqual({
      foo: 'foo',
      bar: {
        a: '1',
        b: '2',
      },
    });
  });
  it('should set validation states as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: 'a',
          b: 'b',
        },
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
    });
    expect(subFormApi.getValue('.')).toStrictEqual({
      a: 'a',
      b: 'b',
    });
    formApi.setValidationState('bar', {
      isValid: false,
      isValidating: true,
      message: 'boom',
    });
    expect(subFormApi.getValidationStates()).toStrictEqual({
      errors: {
        '.': {
          isValid: false,
          isValidating: true,
          message: 'boom',
        },
      },
      isValid: false,
      isValidating: true,
    });
    formApi.setValidationState('foo', (prev) => ({
      ...prev,
      isValidating: true,
    }));
    subFormApi.setValidationState('a', (prev) => {
      return {
        ...prev,
        isValid: false,
      };
    });
    expect(formApi.getValidationState('bar.a')).toStrictEqual({
      isValidating: false,
      isValid: false,
      message: undefined,
    });
    expect(formApi.getValidationState('foo').isValidating).toBeTruthy();
    subFormApi.resetValidationState('.');
    expect(formApi.getValidationStates()).toStrictEqual({
      errors: {
        foo: {
          isValidating: true,
          isValid: true,
          message: undefined,
        },
        'bar.a': {
          isValidating: false,
          isValid: false,
          message: undefined,
        },
      },
      isValidating: true,
      isValid: false,
    });
    subFormApi.resetValidationStates();
    expect(formApi.getValidationStates()).toStrictEqual({
      errors: {
        foo: {
          isValidating: true,
          isValid: true,
          message: undefined,
        },
      },
      isValidating: true,
      isValid: true,
    });
  });
  it('should trigger validate all as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: {
          a: '',
          b: '',
        },
      },
      validators: {
        foo: [(v) => (!v ? 'required' : undefined)],
        'bar.a': [(v) => (!v ? 'required' : undefined)],
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
      validators: {
        '.': [(v) => (v.a !== 'a' ? 'invalid a' : undefined)],
        b: [(v) => (v.length !== 1 ? 'invalid b' : undefined)],
      },
    });
    await subFormApi.validate();
    expect(formApi.getValidationStates()).toStrictEqual({
      errors: {
        bar: {
          isValid: false,
          isValidating: false,
          message: 'invalid a',
        },
        'bar.a': {
          isValid: false,
          isValidating: false,
          message: 'required',
        },
        'bar.b': {
          isValid: false,
          isValidating: false,
          message: 'invalid b',
        },
      },
      isValid: false,
      isValidating: false,
    });
  });
  it('should submit as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: '',
          b: 'b',
        },
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
      validators: {
        a: [(v) => (!v ? 'required' : undefined)],
      },
    });
    await expect(subFormApi.submit()).rejects.toThrow();
    subFormApi.setValue('a', 'a');
    await expect(subFormApi.submit()).resolves.toStrictEqual({
      a: 'a',
      b: 'b',
    });
  });
  it('should work as expected when subscribe', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: '',
          b: 'b',
        },
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
      validators: {
        a: [(v) => (!v ? 'required' : undefined)],
      },
    });
    const mockSubValues = vi.fn();
    const mockSubErrors = vi.fn();
    subFormApi.subscribe('values', {
      immediate: true,
      listener: mockSubValues,
    });
    subFormApi.subscribe('errors', {
      immediate: true,
      listener: mockSubErrors,
    });
    subFormApi.setValue('a', 'a');
    expect(mockSubValues).toBeCalledWith({
      a: 'a',
      b: 'b',
    });
    await delay();
    subFormApi.setValue('a', '');
    expect(mockSubValues).toBeCalledTimes(2);
    await delay();
    expect(subFormApi.getValidationState('a').isValid).toBeFalsy();
    expect(mockSubErrors).toBeCalledWith({
      a: {
        isValid: false,
        isValidating: false,
        message: 'required',
      },
    });
  });
  it('should subscribe field as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: '',
          b: 'b',
        },
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
      validators: {
        a: [(v) => (!v ? 'required' : undefined)],
      },
    });
    const mockSubValue = vi.fn();
    const mockSubError = vi.fn();
    subFormApi.subscribeField('a', 'value', {
      immediate: true,
      listener: mockSubValue,
    });
    subFormApi.subscribeField('a', 'error', {
      immediate: true,
      listener: mockSubError,
    });
    subFormApi.setValue('a', 'a');
    expect(mockSubValue).toBeCalledWith('a');
    await delay();
    subFormApi.setValue('a', '');
    await delay();
    expect(mockSubValue).toBeCalledTimes(2);
    expect(mockSubError).toBeCalledWith({
      isValid: false,
      isValidating: false,
      message: 'required',
    });
  });
  it('should get field as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: 'a',
          b: 'b',
        },
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
      validators: {
        a: [(v) => (!v ? 'required' : undefined)],
      },
    });
    expect(subFormApi.getField('a').getValue()).toBe('a');
    expect(formApi.getField('bar.a').getValue()).toBe('a');
  });
  it('should work as expected when nested get sub form', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: 'a',
          b: 'b',
          nested: {
            foo: 'bar',
          },
        },
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
      validators: {
        a: [(v) => (!v ? 'required' : undefined)],
      },
    });
    const nestedFormApi = subFormApi.getSubForm({
      prefix: 'nested',
      validators: {
        foo: [(v) => (!v ? 'required' : undefined)],
      },
    });
    expect(nestedFormApi.getValues()).toStrictEqual({
      foo: 'bar',
    });
    nestedFormApi.getField('foo').setValue('');
    await delay();
    expect(nestedFormApi.getValidationState('foo').isValid).toBeFalsy();
    expect(subFormApi.getValidationState('nested.foo').isValid).toBeFalsy();
  });
  it('should not trigger errors subscriber when changed errors not in sub form', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: 'foo',
        bar: {
          a: 'a',
          b: 'b',
        },
      },
      validators: {
        foo: [(v) => (!v ? 'required' : undefined)],
      },
    });
    const subFormApi = formApi.getSubForm({
      prefix: 'bar',
      validators: {
        a: [(v) => (!v ? 'required' : undefined)],
      },
    });
    const mockErrorsListener = vi.fn();
    subFormApi.subscribe('errors', {
      listener: mockErrorsListener,
    });
    await formApi.validate('foo');
    await delay();
    expect(mockErrorsListener).not.toBeCalled();
    await formApi.validate('bar.a');
    await delay();
    expect(mockErrorsListener).toBeCalled();
  });
});
