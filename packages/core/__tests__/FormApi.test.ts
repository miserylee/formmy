import { FormApi } from '../src';

const delay = (ms: number = 100) => new Promise((resolve) => setTimeout(resolve, ms));

describe('formApi', () => {
  it('should set initial options as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: '',
      },
      validators: {
        foo: [(v) => (!v ? 'foo is required' : undefined)],
      },
      interactions: [
        {
          deps: ['foo'],
          action: (formApi1) => {
            formApi1.setValue('bar', formApi1.getValue('foo'));
          },
        },
      ],
    });
    expect(formApi.getValues()).toStrictEqual({
      foo: '',
      bar: '',
    });
    formApi.setValue('foo', '1');
    expect(formApi.getValue('foo')).toBe('1');
    expect(formApi.getValue('bar')).toBe('');
    await delay();
    expect(formApi.getValue('bar')).toBe('1');
    formApi.setValue('foo', '');
    await delay();
    expect(formApi.getValidationState('foo').isValid).toBeFalsy();
  });
  it('should update validators as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: '',
      },
    });
    formApi.setValue('foo', 'a');
    expect(formApi.getValidationState('foo').isValid).toBeTruthy();
    formApi.setValidators((prev) => {
      return {
        ...prev,
        foo: [(v) => (!!v ? 'v should be empty' : undefined)],
      };
    });
    await delay();
    formApi.setValue('foo', 'ab');
    await delay();
    expect(formApi.getValidationState('foo').isValid).toBeFalsy();
    formApi.setValidators((prev) => {
      return {
        ...prev,
        foo: [
          {
            validate: (v) => (!v ? 'v is required' : undefined),
            deps: ['bar'],
          },
        ],
      };
    });
    await delay();
    formApi.setValue('bar', 'a');
    await delay();
    expect(formApi.getValidationState('foo').isValid).toBeTruthy();
  });
  it('should update interactions as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: '',
      },
    });
    formApi.setInteractions((prev) => {
      return [
        ...prev,
        {
          deps: ['foo'],
          action() {
            formApi.setValue('bar', '111');
          },
        },
      ];
    });
    await delay();
    expect(formApi.getValue('bar')).toBe('');
    formApi.setValue('foo', 'a');
    await delay();
    expect(formApi.getValue('foo')).toBe('a');
    expect(formApi.getValue('bar')).toBe('111');
  });
  it('should validate failed when validate fn throws', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: '',
      },
      validators: {
        foo: [
          (v) => {
            throw new Error('boom');
          },
        ],
      },
    });
    formApi.setValue('foo', '1');
    await delay();
    expect(formApi.getValidationStates()).toStrictEqual({
      errors: {
        foo: {
          isValid: false,
          isValidating: false,
          message: 'boom',
        },
      },
      isValid: false,
      isValidating: false,
    });
  });
  it('should trigger validate when any field changed when deps not set', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: '',
      },
      validators: {
        foo: [
          {
            validate: (v) => (!v ? 'foo is required' : undefined),
          },
        ],
      },
    });
    formApi.setValue('bar', 'a');
    await delay();
    expect(formApi.getValidationState('foo').isValid).toBeFalsy();
    formApi.setValue('foo', '1');
    await delay();
    expect(formApi.getValidationState('foo').isValid).toBeTruthy();
  });
  it('should set validation states as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: '',
      },
    });
    formApi.setValidationStates((prev) => {
      return {
        foo: {
          isValid: false,
          isValidating: true,
          message: 'boom',
        },
      };
    });
    expect(formApi.getValidationState('foo')).toStrictEqual({
      isValid: false,
      isValidating: true,
      message: 'boom',
    });
  });
  it('should reset validation states as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: '',
      },
    });
    formApi.setValidationStates((prev) => {
      return {
        foo: {
          isValid: false,
          isValidating: true,
          message: 'boom',
        },
        bar: {
          isValid: false,
          isValidating: false,
          message: 'boom',
        },
      };
    });
    formApi.resetValidationStates();
    expect(formApi.getValidationState('foo')).toStrictEqual({
      isValid: true,
      isValidating: false,
      message: undefined,
    });
    expect(formApi.getValidationState('bar')).toStrictEqual({
      isValid: true,
      isValidating: false,
      message: undefined,
    });
    formApi.setValidationState('foo', {
      isValidating: true,
      isValid: false,
      message: '1211',
    });
    expect(formApi.getValidationState('foo')).toStrictEqual({
      isValidating: true,
      isValid: false,
      message: '1211',
    });
    formApi.resetValidationState('foo');
    expect(formApi.getValidationState('foo')).toStrictEqual({
      isValid: true,
      isValidating: false,
      message: undefined,
    });
  });
  it('should set value of whole form when key is dot', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: '',
      },
    });
    formApi.setValue('.', {
      foo: '1',
      bar: '2',
    });
    expect(formApi.getValue('foo')).toBe('1');
    expect(formApi.getValue('bar')).toBe('2');
  });
  it('should trigger validate as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: '',
      },
      validators: {
        foo: [(v) => (!v ? 'foo is required' : undefined)],
      },
    });
    expect(formApi.getValidationState('foo').isValid).toBeTruthy();
    const res = await formApi.validate('foo');
    expect(res).toStrictEqual({
      isValid: false,
      isValidating: false,
      message: 'foo is required',
    });
    expect(formApi.getValidationState('foo')).toStrictEqual({
      isValid: false,
      isValidating: false,
      message: 'foo is required',
    });
  });
  it('should submit as expected', async () => {
    const formApi = new FormApi({
      initialValues: {
        foo: '',
        bar: '',
      },
      validators: {
        foo: [(v) => (!v ? 'foo is required' : undefined)],
      },
    });
    await expect(formApi.submit()).rejects.toThrow();
    expect(formApi.getValidationState('foo')).toStrictEqual({
      isValid: false,
      isValidating: false,
      message: 'foo is required',
    });
    formApi.setValue('foo', '1');
    await expect(formApi.submit()).resolves.toStrictEqual({
      foo: '1',
      bar: '',
    });
    expect(formApi.getValidationState('foo').isValid).toBeTruthy();
  });
});
