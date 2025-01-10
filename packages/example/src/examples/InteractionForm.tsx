import { getFormFactory } from '@formmy/react';

interface FormValues {
  a: string;
  b: string;
  c: string;
}

const factory = getFormFactory<FormValues>();

export function InteractionForm(): JSX.Element {
  return (
    <div className="flex flex-col gap-5 p-5 bg-white">
      <factory.Form
        initialValues={{
          a: '',
          b: '',
          c: '',
        }}
        interactions={[
          {
            deps: ['a'],
            action: (formApi) => {
              formApi.setValue('b', `a is ${formApi.getValue('a')}`);
            },
          },
          {
            deps: ['a', 'b'],
            action: (formApi) => {
              formApi.setValue(
                'c',
                `a+b count ${formApi.getValue('a').length + formApi.getValue('b').length}`
              );
            },
          },
          {
            deps: ['c'],
            action: (formApi) => {
              formApi.setValue('a', formApi.getValue('c'));
            },
          },
        ]}
      >
        <factory.Field fieldKey="a">
          {(fieldApi) => (
            <label>
              <div>A</div>
              <input
                className="border"
                value={fieldApi.getValue()}
                onChange={(e) => fieldApi.setValue(e.target.value)}
              />
            </label>
          )}
        </factory.Field>
        <factory.Field fieldKey="b">
          {(fieldApi) => (
            <label>
              <div>B</div>
              <input
                className="border"
                value={fieldApi.getValue()}
                onChange={(e) => fieldApi.setValue(e.target.value)}
              />
            </label>
          )}
        </factory.Field>
        <factory.Field fieldKey="c">
          {(fieldApi) => (
            <label>
              <div>C</div>
              <input
                className="border"
                value={fieldApi.getValue()}
                onChange={(e) => fieldApi.setValue(e.target.value)}
              />
            </label>
          )}
        </factory.Field>
        <factory.Subscribe>
          {(formApi) => (
            <pre>
              <code>{JSON.stringify(formApi.getValues(), null, 2)}</code>
            </pre>
          )}
        </factory.Subscribe>
      </factory.Form>
    </div>
  );
}
