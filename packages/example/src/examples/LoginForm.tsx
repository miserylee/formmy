import { type ReactElement } from 'react';

import { getFormFactory } from '@formmy/react';
import classNames from 'classnames';

interface LoginFormValues {
  username: string;
  password: string;
}

const factory = getFormFactory<LoginFormValues>();

export function LoginForm(): ReactElement {
  return (
    <div className="flex flex-col gap-4 rounded shadow p-5 bg-white">
      <factory.Form initialValues={{ username: '', password: '' }}>
        <factory.Field
          fieldKey="username"
          validators={[
            {
              validate(v) {
                return !v ? 'Username is required.' : undefined;
              },
              deps: [],
            },
          ]}
        >
          {(fieldApi) => (
            <label>
              <div>Username</div>
              <input
                className={classNames('border outline-0', {
                  'border-red-400': !fieldApi.getValidationState().isValid,
                })}
                value={fieldApi.getValue()}
                onChange={(e) => fieldApi.setValue(e.target.value)}
                onBlur={fieldApi.validate}
              />
              {fieldApi.getValidationState().isValid ? null : (
                <div className="text-red-400">{fieldApi.getValidationState().message}</div>
              )}
            </label>
          )}
        </factory.Field>
        <factory.Field
          fieldKey="password"
          validators={[
            {
              validate(v) {
                return !v ? 'Password is required.' : undefined;
              },
              deps: [],
            },
          ]}
        >
          {(fieldApi) => (
            <label>
              <div>Password</div>
              <input
                className={classNames('border outline-0', {
                  'border-red-400': !fieldApi.getValidationState().isValid,
                })}
                value={fieldApi.getValue()}
                onChange={(e) => fieldApi.setValue(e.target.value)}
                onBlur={fieldApi.validate}
                type="password"
              />
              {fieldApi.getValidationState().isValid ? null : (
                <div className="text-red-400">{fieldApi.getValidationState().message}</div>
              )}
            </label>
          )}
        </factory.Field>
        <factory.Action>
          {(formApi) => (
            <button
              className="border mt-3 bg-blue-500 text-white py-2 hover:bg-blue-400 transition active:bg-blue-600"
              onClick={async () => {
                const result = await formApi.validate();
                if (!result.isValid) {
                  return;
                }
                alert(`Login success! ${formApi.getValue('username')}`);
                formApi.reset();
              }}
            >
              Login
            </button>
          )}
        </factory.Action>
      </factory.Form>
    </div>
  );
}
