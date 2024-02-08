import { combine, createEvent, createStore, is, sample } from 'effector';
import { SyntheticEvent } from 'react';
import {
  CreateFormParams,
  ErrorsInline,
  FieldInitParams,
  FieldsInline,
  FieldState,
  Form,
  FormState,
  ResetOuterErrorParams,
  SetFieldStateParams,
  SetOrDeleteErrorParams,
  SetOrDeleteOuterErrorParams,
  SetValueParams,
  SetValuesParams,
  SubmitParams,
} from '../ts';
import { initialFieldState, initialFormState } from '../default-states';
import { getValue } from '../utils/dom-helper';
import {
  deleteIn,
  getIn,
  GetName,
  getName,
  getNameStr,
  GetNameStr,
  makeConsistentKey,
  setIn,
} from '../utils/object-manager';

const createForm = <Values extends object = any, Meta = any>({
  name,
  validate,
  mapSubmit = (params) => params,
  onSubmit: onSubmitArg,
  onSubmitGuardFn = ({ form }) => !form.hasError,
  onChange: onChangeArg,
  onChangeGuardFn = ({ form }) => !form.hasError,
  initialValues,
  initialMeta = {} as any,
  domain,
  resetOuterErrorsBySubmit = true,
  resetOuterErrorByOnChange = true,
  validateByOnChange = true,
}: CreateFormParams<Values, Values, Meta> = {}): Form<Values> => {
  const setMeta = createEvent<Meta>({
    name: `Form_${name}_SetMeta`,
    domain,
  });

  const setValue = createEvent<SetValueParams>({
    name: `Form_${name}_SetValue`,
    domain,
  });
  const setValues = createEvent<SetValuesParams<Values>>({
    name: `Form_${name}_SetValues`,
    domain,
  });
  const setOrDeleteError = createEvent<SetOrDeleteErrorParams>({
    name: `Form_${name}_SetOrDeleteError`,
    domain,
  });
  const setErrorsInlineState = createEvent<ErrorsInline>({
    name: `Form_${name}_SetErrorsInlineState`,
    domain,
  });
  const setFieldState = createEvent<SetFieldStateParams>({
    name: `Form_${name}_SetFieldState`,
    domain,
  });
  const setSubmitted = createEvent<boolean>({
    name: `Form_${name}_SetSubmitted`,
    domain,
  });
  const resetOuterFieldStateFlags = createEvent({
    name: `Form_${name}_ResetOuterFieldStateFlags`,
    domain,
  });
  const resetOuterErrors = createEvent({
    name: `Form_${name}_ResetOuterErrors`,
    domain,
  });
  const resetOuterError = createEvent<ResetOuterErrorParams>({
    name: `Form_${name}_ResetOuterError`,
    domain,
  });
  const setOrDeleteOuterError = createEvent<SetOrDeleteOuterErrorParams>({
    name: `Form_${name}_SetOrDeleteOuterError`,
    domain,
  });
  const reset = createEvent({
    name: `Form_${name}_Reset`,
    domain,
  });

  const setOuterErrorsInlineState = createEvent<ErrorsInline>({
    name: `Form_${name}_SetOuterErrorsInlineState`,
    domain,
  });
  const validateForm = createEvent({
    name: `Form_${name}_ValidateForm`,
    domain,
  });
  const submit = createEvent({
    name: `Form_${name}_Submit`,
    domain,
  });
  const onSubmit = createEvent<SubmitParams<Values, Meta>>({
    name: `Form_${name}_OnSubmit`,
    domain,
  });
  const onChange = createEvent<SubmitParams<Values, Meta>>({
    name: `Form_${name}_OnChange`,
    domain,
  });

  const $values = createStore<Values>(initialValues || ({} as Values), {
    name: `Form_${name}_$values`,
    domain,
  });
  const $errorsInline = createStore<ErrorsInline>(
    {},
    {
      name: `Form_${name}_$errorsInline`,
      domain,
    },
  );
  const $outerErrorsInline = createStore<ErrorsInline>(
    {},
    {
      name: `Form_${name}_$outerErrorsInline`,
      domain,
    },
  );
  const $fieldsInline = createStore<FieldsInline>(
    {},
    {
      name: `Form_${name}_$fieldsInline`,
      domain,
    },
  );
  const $fieldsInlineInitData = createStore(
    {},
    {
      name: `Form_${name}_$fieldsInlineInitData`,
      domain,
    },
  );
  const $form = createStore<FormState>(initialFormState, {
    name: `Form_${name}_$form`,
    domain,
  });
  const $meta = createStore<Meta>(initialMeta, {
    name: `Form_${name}_$meta`,
    domain,
  });

  const $allFormState = combine({
    values: $values,
    errorsInline: $errorsInline,
    outerErrorsInline: $outerErrorsInline,
    fieldsInline: $fieldsInline,
    form: $form,
    meta: $meta,
  });

  const onChangeFieldBrowser = createEvent<{ event: SyntheticEvent; name: string; flat?: boolean }>(
    `Form_${name}_OnChangeFieldBrowser`,
  );
  const onChangeField = onChangeFieldBrowser.map<{ value: any; name: string; flat?: boolean }>(
    ({ name, event, flat }) => ({
      value: getValue(event),
      name,
      flat,
    }),
  );
  const onFocusFieldBrowser = createEvent<{ event: SyntheticEvent; name: string }>({
    name: `Form_${name}_OnFocusFieldBrowser`,
    domain,
  });
  const onBlurFieldBrowser = createEvent<{ event: SyntheticEvent; name: string }>({
    name: `Form_${name}_OnBlurFieldBrowser`,
    domain,
  });
  const fieldInit = createEvent<FieldInitParams>({
    name: `Form_${name}_fieldInit`,
    domain,
  });

  const validateByValues = ({ values, fieldsInline, ...rest }: SubmitParams) => {
    const errorsInlineState = {};

    Object.entries<FieldState>(fieldsInline).forEach(([name, { validate }]) => {
      const error = validate && validate(getIn(values, name));
      if (error) {
        errorsInlineState[name] = validate && validate(getIn(values, name));
      }
    });

    if (validate) {
      const formLevelErrorsInlineState = validate({ ...rest, values, errorsInline: errorsInlineState, fieldsInline });
      Object.entries(formLevelErrorsInlineState).forEach(([name, error]) => {
        if (error) {
          errorsInlineState[name] = error;
        } else {
          delete errorsInlineState[name];
        }
      });
    }

    return errorsInlineState;
  };

  if (resetOuterErrorByOnChange) {
    sample({
      source: onChangeField,
      fn: ({ name }) => name,
      target: resetOuterError,
    });
  }

  sample({
    clock: submit,
    target: [validateForm, resetOuterFieldStateFlags],
  });

  if (resetOuterErrorsBySubmit) {
    sample({
      clock: submit,
      target: resetOuterErrors,
    });
  }

  sample({
    source: resetOuterErrors,
    fn: () => ({}),
    target: $outerErrorsInline,
  });

  sample({
    source: $allFormState,
    clock: validateForm,
    fn: (params) => validateByValues(params),
    target: $errorsInline,
  });

  sample({
    source: $allFormState,
    clock: $values,
    filter: () => validateByOnChange,
    fn: (params) => validateByValues(params),
    target: $errorsInline,
  });

  sample({
    source: $allFormState,
    clock: sample({
      source: submit,
      filter: $allFormState.map(onSubmitGuardFn),
    }),
    fn: mapSubmit,
    target: onSubmit,
  });

  sample({
    source: $allFormState,
    clock: sample({
      source: onChangeFieldBrowser,
      filter: $allFormState.map(onChangeGuardFn),
    }),
    fn: mapSubmit,
    target: onChange,
  });

  if (onSubmitArg) {
    if (is.event(onSubmitArg)) {
      sample({
        clock: onSubmit,
        target: onSubmitArg,
      });
    } else if (is.effect(onSubmitArg)) {
      sample({
        clock: onSubmit,
        target: onSubmitArg,
      });
    } else if (typeof onSubmitArg === 'function') {
      onSubmit.watch(onSubmitArg);
    }
  }

  if (onChangeArg) {
    if (is.event(onChangeArg)) {
      sample({
        clock: onChange,
        target: onChangeArg,
      });
    } else if (is.effect(onChangeArg)) {
      sample({
        clock: onChange,
        target: onChangeArg,
      });
    } else if (typeof onChangeArg === 'function') {
      onChange.watch(onChangeArg);
    }
  }

  $values
    .on(setValue, (state, { field, value }) => setIn(state, field, value))
    .on(setValues, (_, values) => values)
    .on(onChangeField, (state, { value, name, flat }) =>
      flat ? { ...state, [name]: value } : setIn(state, name, value),
    )
    .reset(reset);

  $errorsInline
    .on(setOrDeleteError, (state, { field, error }) =>
      error ? { ...state, [makeConsistentKey(field)]: error } : deleteIn(state, field, false, false),
    )
    .on(setErrorsInlineState, (_, errorsInline) => errorsInline)
    .reset(reset);

  $outerErrorsInline
    .on(setOrDeleteOuterError, (state, { field, error }) =>
      error ? { ...state, [makeConsistentKey(field)]: error } : deleteIn(state, field, false, false),
    )
    .on(setOuterErrorsInlineState, (_, errorsInline) => errorsInline)
    .on(resetOuterError, (errors, field) => deleteIn(errors, field, false, false))
    .reset(reset);

  $fieldsInline
    .on(setOrDeleteOuterError, (state, { field }) => ({
      ...state,
      [makeConsistentKey(field)]: {
        ...state[makeConsistentKey(field)],
        touchedAfterOuterError: false,
        changedAfterOuterError: false,
        blurredAfterOuterError: false,
      },
    }))
    .on(resetOuterFieldStateFlags, (state) => {
      const newState = {};
      Object.entries<FieldState>(state).forEach(
        ([field, state]) =>
          (newState[field] = {
            ...state,
            touchedAfterOuterError: false,
            changedAfterOuterError: false,
            blurredAfterOuterError: false,
          }),
      );
      return newState;
    })
    .on(setFieldState, (state, { field, state: fieldState }) => {
      return { ...state, [makeConsistentKey(field)]: fieldState };
    })
    .on(fieldInit, (state, { name, validate, flat }) =>
      state[flat ? name : makeConsistentKey(name)]
        ? {
            ...state,
            [flat ? name : makeConsistentKey(name)]: {
              ...state[flat ? name : makeConsistentKey(name)],
              ...initialFieldState,
              validate,
            },
          }
        : { ...state, [flat ? name : makeConsistentKey(name)]: { ...initialFieldState, validate } },
    );

  $fieldsInlineInitData.on(fieldInit, (state, { name, validate, flat }) =>
    state[flat ? name : makeConsistentKey(name)]
      ? {
          ...state,
          [flat ? name : makeConsistentKey(name)]: {
            ...state[flat ? name : makeConsistentKey(name)],
            ...initialFieldState,
            validate,
          },
        }
      : { ...state, [flat ? name : makeConsistentKey(name)]: { ...initialFieldState, validate } },
  );

  sample({
    source: $fieldsInlineInitData,
    clock: reset,
    target: $fieldsInline,
  });

  $form
    .on($outerErrorsInline.updates, (state, outerErrors) =>
      setIn(state, 'hasOuterError', Boolean(Object.keys(outerErrors).length)),
    )
    .on(submit, (state) => setIn(state, 'submitted', true))
    .on(setSubmitted, (state, value) => setIn(state, 'submitted', value))
    .on($errorsInline.updates, (state, errorsInline) =>
      setIn(state, 'hasError', Boolean(Object.keys(errorsInline).length)),
    )
    .reset(reset);

  $meta.on(setMeta, (state, meta) => meta || state).reset(reset);

  /// Field {

  sample({
    source: {
      fieldsInline: $fieldsInline,
      outerErrorsInline: $outerErrorsInline,
    },
    clock: onFocusFieldBrowser,
    fn: ({ fieldsInline, outerErrorsInline }, { name }) => ({
      ...fieldsInline,
      [name]: {
        ...fieldsInline[name],
        active: true,
        touched: true,
        touchedAfterOuterError: Boolean(outerErrorsInline[name]),
      },
    }),
    target: $fieldsInline,
  });
  sample({
    source: {
      fieldsInline: $fieldsInline,
      outerErrorsInline: $outerErrorsInline,
    },
    clock: onChangeFieldBrowser,
    fn: ({ fieldsInline, outerErrorsInline }, { name }) => ({
      ...fieldsInline,
      [name]: {
        ...fieldsInline[name],
        changed: true,
        changedAfterOuterError: Boolean(outerErrorsInline[name]),
      },
    }),
    target: $fieldsInline,
  });
  sample({
    source: {
      fieldsInline: $fieldsInline,
      outerErrorsInline: $outerErrorsInline,
    },
    clock: onBlurFieldBrowser,
    fn: ({ fieldsInline, outerErrorsInline }, { name }) => ({
      ...fieldsInline,
      [name]: {
        ...fieldsInline[name],
        active: false,
        blurred: true,
        blurredAfterOuterError: Boolean(outerErrorsInline[name]),
      },
    }),
    target: $fieldsInline,
  });

  /// }

  return {
    setValue,
    setValues,
    setOrDeleteError,
    setErrorsInlineState,
    setFieldState,
    setSubmitted,
    resetOuterFieldStateFlags,
    resetOuterErrors,
    setOrDeleteOuterError,
    setOuterErrorsInlineState,
    validateForm,
    submit,
    reset,
    onSubmit,

    setMeta,

    $values,
    $errorsInline,
    $outerErrorsInline,
    $fieldsInline,
    $form,
    $meta,
    $allFormState,

    onChangeFieldBrowser,
    onFocusFieldBrowser,
    onBlurFieldBrowser,
    fieldInit,

    getName: getName as GetName<Values>,
    getNameStr: getNameStr as GetNameStr<Values>,

    name,
  };
};

export default createForm;
