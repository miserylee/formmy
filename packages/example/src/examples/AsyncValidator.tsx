import { type ReactElement } from 'react';

import { getFormFactory } from '@formmy/react';

interface FormValues {
  value: string;
}

const factory = getFormFactory<FormValues>();

export function AsyncValidator(): ReactElement {
  return (
    <factory.Form initialValues={{ value: '' }}>
      <factory.Field
        fieldKey="value"
        validators={{
          validate: async (v) => {
            console.log('validate', v);
            return new Promise((resolve) =>
              setTimeout(() => {
                resolve('value is invalid');
              }, 1000)
            );
          },
          debounce: 300,
        }}
      >
        {(fieldApi) => (
          <label>
            <div>Input sth. to trigger validator</div>
            <input
              className="border"
              value={fieldApi.getValue()}
              onChange={(e) => fieldApi.setValue(e.target.value)}
            />
            {fieldApi.getValidationState().isValidating ? (
              <div>Validating...</div>
            ) : fieldApi.getValidationState().isValid ? null : (
              <div className="text-red-400">{fieldApi.getValidationState().message}</div>
            )}
          </label>
        )}
      </factory.Field>
    </factory.Form>
  );
}
