import { useMemo } from 'react';

import { getFormFactory } from '@formmy/react';

interface FormValues {
  no: number;
  list: {
    username: string;
    department: string;
  }[];
}

const formFactory = getFormFactory<FormValues>();

function ListItem({ index }: { index: number }) {
  const subFormFactory = useMemo(() => formFactory.getSubFormFactory(`list.${index}`), [index]);
  return (
    <subFormFactory.Form
      interactions={[
        {
          deps: ['username'],
          action: (formApi) => {
            formApi.setValue('department', '');
          },
        },
      ]}
    >
      <li className="flex items-center gap-4">
        <subFormFactory.Field fieldKey="username">
          {(fieldApi) => (
            <label>
              Username
              <input value={fieldApi.getValue()} onChange={(e) => fieldApi.setValue(e.target.value)} />
            </label>
          )}
        </subFormFactory.Field>
        <subFormFactory.Field fieldKey="department">
          {(fieldApi) => (
            <label>
              Department
              <input value={fieldApi.getValue()} onChange={(e) => fieldApi.setValue(e.target.value)} />
            </label>
          )}
        </subFormFactory.Field>
        <formFactory.Subscribe>
          {(formApi) => (
            <button
              onClick={() => {
                formApi.setValue('list', (prev) => {
                  const next = [...prev];
                  next.splice(index, 1);
                  return next;
                });
              }}
            >
              ×
            </button>
          )}
        </formFactory.Subscribe>
      </li>
    </subFormFactory.Form>
  );
}

export function SubForm(): JSX.Element {
  return (
    <formFactory.Form
      initialValues={{
        no: 0,
        list: [],
      }}
    >
      <div className="flex gap-10">
        <div className="flex flex-col gap-4">
          <formFactory.Field fieldKey="no">
            {(fieldApi) => (
              <label>
                No.
                <input
                  type="number"
                  value={fieldApi.getValue()}
                  onChange={(e) => fieldApi.setValue(Number(e.target.value))}
                />
              </label>
            )}
          </formFactory.Field>
          <formFactory.Field fieldKey="list">
            {(fieldApi) => (
              <ul className="flex flex-col gap-4">
                {fieldApi.getValue().map((_, index) => (
                  <ListItem key={index} index={index} />
                ))}
                <button
                  onClick={() => {
                    fieldApi.setValue((prev) => [
                      ...prev,
                      {
                        username: '',
                        department: '',
                      },
                    ]);
                  }}
                >
                  +
                </button>
              </ul>
            )}
          </formFactory.Field>
        </div>
        <formFactory.Field fieldKey=".">
          {(fieldApi) => (
            <pre>
              <code>{JSON.stringify(fieldApi.getValue(), null, 2)}</code>
            </pre>
          )}
        </formFactory.Field>
      </div>
    </formFactory.Form>
  );
}
