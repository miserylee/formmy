import { FormApi } from '@formmy/core';
import { type FormFactory, getFormFactory } from '@formmy/react';

interface CommonFormValues {
  label: string;
  value: string;
}

interface FormA {
  common: CommonFormValues;
  foo: string;
}

interface FormB {
  nested: {
    common: CommonFormValues;
  };
  bar: string;
}

const formAFactory = getFormFactory<FormA>();

function CommonForm({ factory }: { factory: FormFactory<CommonFormValues, true> }) {
  return (
    <div className="flex flex-col gap-4">
      <factory.Form>
        <label>
          label:{' '}
          <factory.Field fieldKey="label">
            {(fieldApi) => (
              <input value={fieldApi.getValue()} onChange={(e) => fieldApi.setValue(e.target.value)} />
            )}
          </factory.Field>
        </label>
        <label>
          value:{' '}
          <factory.Field fieldKey="value">
            {(fieldApi) => (
              <input value={fieldApi.getValue()} onChange={(e) => fieldApi.setValue(e.target.value)} />
            )}
          </factory.Field>
        </label>
      </factory.Form>
    </div>
  );
}

const commonFormFactoryInFormA = formAFactory.getSubFormFactory('common');

function FormA() {
  return (
    <div className="flex flex-col gap-4">
      <formAFactory.Form
        initialValues={{
          foo: 'foo',
          common: {
            label: 'a label',
            value: 'a value',
          },
        }}
      >
        <label>
          foo:{' '}
          <formAFactory.Field fieldKey="foo">
            {(fieldApi) => (
              <input value={fieldApi.getValue()} onChange={(e) => fieldApi.setValue(e.target.value)} />
            )}
          </formAFactory.Field>
        </label>
        <CommonForm factory={commonFormFactoryInFormA} />
        <formAFactory.Subscribe>
          {(formApi) => (
            <pre>
              <code>{JSON.stringify(formApi.getValues(), null, 2)}</code>
            </pre>
          )}
        </formAFactory.Subscribe>
      </formAFactory.Form>
    </div>
  );
}

const sharedFormBApi = new FormApi<FormB>({
  initialValues: {
    bar: 'bar',
    nested: {
      common: {
        label: 'b label',
        value: 'b value',
      },
    },
  },
});

const formBFactory = getFormFactory<FormB>(function useForm() {
  return sharedFormBApi;
});

const commonFormFactoryInFormB = formBFactory.getSubFormFactory('nested.common');

function FormB() {
  return (
    <div className="flex flex-col gap-4">
      <formBFactory.Form>
        <label>
          bar:{' '}
          <formBFactory.Field fieldKey="bar">
            {(fieldApi) => (
              <input value={fieldApi.getValue()} onChange={(e) => fieldApi.setValue(e.target.value)} />
            )}
          </formBFactory.Field>
        </label>
        <CommonForm factory={commonFormFactoryInFormB} />
        <formBFactory.Subscribe>
          {(formApi) => (
            <pre>
              <code>{JSON.stringify(formApi.getValues(), null, 2)}</code>
            </pre>
          )}
        </formBFactory.Subscribe>
      </formBFactory.Form>
    </div>
  );
}

export function FormBinding(): JSX.Element {
  return (
    <div className="flex gap-4 items-start">
      <FormA />
      <FormA />
      <FormB />
      <FormB />
    </div>
  );
}
