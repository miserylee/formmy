import { type ReactElement } from 'react';

import { getFormFactory } from '@formmy/react';
import classNames from 'classnames';

interface LoginFormValues {
  username: string;
  password: string;
}

const factory = getFormFactory<LoginFormValues>();

export function LoginForm(): ReactElement {
  const formBridge = factory.useFormBridge();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded bg-white p-5 shadow">
        <factory.Form initialValues={{ username: '', password: '' }} ref={formBridge.ref}>
          <factory.Field
            fieldKey="username"
            validators={(v) => {
              return !v ? 'Username is required.' : undefined;
            }}
            deps={['password']}
          >
            {(fieldApi) => {
              console.log('rerender');
              return (
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
              );
            }}
          </factory.Field>
          <factory.Field
            fieldKey="password"
            validators={(v) => {
              return !v ? 'Password is required.' : undefined;
            }}
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
          <factory.Subscribe>
            {(formApi) => (
              <button
                className="mt-3 border bg-blue-500 py-2 text-white transition hover:bg-blue-400 active:bg-blue-600"
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
          </factory.Subscribe>
        </factory.Form>
      </div>
      <div className="flex flex-col gap-4">
        {formBridge.renderFormExt(
          <>
            <factory.Field fieldKey="username">
              {(fieldApi) => <span>username: {fieldApi.getValue()}</span>}
            </factory.Field>
            <factory.Subscribe>
              {(formApi) => <span>isValid: {String(formApi.getValidationStates().isValid)}</span>}
            </factory.Subscribe>
          </>
        )}
      </div>
      <button
        onClick={async () => {
          const values = await formBridge.ref.current?.submit();
          console.log(values);
        }}
      >
        submit
      </button>
    </div>
  );
}
