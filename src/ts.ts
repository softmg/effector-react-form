import { Store, Domain, StoreWritable, EventCallable, Event } from 'effector';
import React from 'react';
import { GetName, GetNameStr } from './utils/object-manager';

export type AnyState = Record<string, any>;

export type ErrorsInline = Record<string, Message>;

export type FieldsInline = Record<string, FieldState>;

export type Message = string | null | undefined;

// export type Messages<Values> = {
//   [key in keyof Values]?: Values[key] extends AnyState ? Messages<Values[key]> : Message;
// };

export type SubmitParams<Values = any, Meta = any> = {
  values: Values;
  errorsInline: ErrorsInline;
  fieldsInline: FieldsInline;
  form: FormState;
  meta: Meta;
};

export type FormState = {
  submitted: boolean;
  hasError: boolean;
  hasOuterError: boolean;
};

export type FieldState = {
  _type: 'fieldMeta';
  active: boolean;
  touched: boolean;
  changed: boolean;
  blurred: boolean;
  touchedAfterOuterError: boolean;
  changedAfterOuterError: boolean;
  blurredAfterOuterError: boolean;
  validate?: (value: any) => string | undefined;
};

export type ControllerParams = {
  name: string | string[];
  flat?: boolean;
  validate?: (value: any) => Message;
};

export type SetValueParams = {
  field: string | string[];
  value: any;
};

export type SetValuesParams<Values> = Values;

export type SetOrDeleteErrorParams = {
  field: string | string[];
  error?: Message;
};

export type SetFieldStateParams = {
  field: string | string[];
  state: FieldState;
};

export type SetOrDeleteOuterErrorParams = {
  field: string | string[];
  error: Message;
};

export type ResetOuterErrorParams = string | string[];

export type FieldInitParams = {
  name: string | string[];
  flat?: boolean;
  validate?: ControllerParams['validate'];
};

export type ControllerInjectedResult<Value = any, Meta = any> = {
  input: {
    name: string;
    value: Value;
    onChange: (eventOrValue: React.SyntheticEvent | Value) => void;
    onFocus: (event: React.SyntheticEvent) => void;
    onBlur: (event: React.SyntheticEvent) => void;
  };
  error: Message;
  innerError: Message;
  outerError: Message;
  isShowError: boolean;
  isShowOuterError: boolean;
  isShowInnerError: boolean;
  form: FormState;
  meta: Meta;
  validate?: (value: any) => Message;
  setFieldState: (payload: { field: string; state: FieldState }) => void;
  setOrDeleteError: (payload: { field: string; error: Message }) => void;
  setOrDeleteOuterError: (payload: { field: string; error: Message }) => void;
  setOuterErrorsInlineState: (errors: ErrorsInline) => void;
  fieldState: FieldState;
};

export type Controller<Value = any, Meta = any> = () => ControllerInjectedResult<Value, Meta>;

export type ControllerHof<Value = any, Meta = any> = (params: ControllerParams) => Controller<Value, Meta>;

export type FormValidate<Values, Meta> = (params: FormValidateParams<Values, Meta>) => ErrorsInline;

export type MapSubmit<Values, ResultValues, Meta = any> = (
  params: SubmitParams<Values, Meta>,
) => SubmitParams<ResultValues, Meta>;

export type FormValidateParams<Values, Meta> = SubmitParams<Values, Meta>;

export type OnSubmit<Values, Meta = any> = (params: SubmitParams<Values, Meta>) => void;

export type OnChange<Values, Meta = any> = OnSubmit<Values, Meta>;

export type UseErrorParams<Values = any> = {
  name: string;
  form: Form<Values>;
};

export type UseErrorResult<Meta = any> = {
  inputValue: any;
  form: FormState;
  meta: Meta;
  fieldState: FieldState;
  error: Message;
  innerError: Message;
  outerError: Message;
  isShowError: boolean;
  isShowOuterError: boolean;
  isShowInnerError: boolean;
};

export type FieldArrayParams<Values = any> = {
  name: string;
  fieldArray: FieldArray<Values>;
};

export type MapFieldsArrayCallbackParams = {
  formItemName: string;
  field: any;
  fields: Array<any>;
  index: number;
};

export type MapFieldArrayCallback = (params: MapFieldsArrayCallbackParams) => React.ReactNode;

export type ResultUseFieldArray = {
  map: (fn: MapFieldArrayCallback) => React.ReactNode[];
  remove: (index: number) => void;
  push: (value: any | Array<any>) => void;
  count: number;
};

export type GuardFn<Values = any, Meta = any> = (params: SubmitParams<Values, Meta>) => boolean;

export type CreateFormParams<Values = any, MappedValues = Values, Meta = any> = {
  name?: string;
  validate?: FormValidate<Values, Meta>;
  mapSubmit?: MapSubmit<Values, MappedValues, Meta>;
  onSubmit?: OnSubmit<MappedValues, Meta>;
  onSubmitGuardFn?: GuardFn<Values, Meta>;
  onChange?: OnChange<Values, Meta>;
  onChangeGuardFn?: GuardFn<Values, Meta>;
  initialValues?: Values;
  initialMeta?: Meta;
  domain?: Domain;
  resetOuterErrorsBySubmit?: boolean;
  resetOuterErrorByOnChange?: boolean;
  validateByOnChange?: boolean;
};

export type AllFormState<Values, Meta = any> = {
  values: Values;
  errorsInline: Record<string, string>;
  outerErrorsInline: Record<string, string>;
  fieldsInline: Record<string, FieldState>;
  form: FormState;
  meta: Meta;
};

export type Form<Values = any, Meta = any> = {
  $values: StoreWritable<Values>;
  $errorsInline: StoreWritable<ErrorsInline>;
  $outerErrorsInline: StoreWritable<ErrorsInline>;
  $form: StoreWritable<FormState>;
  $fieldsInline: StoreWritable<Record<string, FieldState>>;
  $meta: StoreWritable<Meta>;
  $allFormState: Store<AllFormState<Values, Meta>>;

  setValue: EventCallable<SetValueParams>;
  setValues: EventCallable<SetValuesParams<Values>>;
  setOrDeleteError: EventCallable<SetOrDeleteErrorParams>;
  setErrorsInlineState: EventCallable<any>;
  setFieldState: EventCallable<SetFieldStateParams>;
  setSubmitted: EventCallable<boolean>;
  resetOuterFieldStateFlags: EventCallable<any>;
  resetOuterErrors: EventCallable<any>;
  setOrDeleteOuterError: EventCallable<SetOrDeleteOuterErrorParams>;
  reset: EventCallable<void>;

  setMeta: EventCallable<Meta>;

  setOuterErrorsInlineState: EventCallable<any>;
  validateForm: EventCallable<void>;
  submit: EventCallable<void>;
  onSubmit: EventCallable<SubmitParams<Values, Meta>>;

  onChangeField: Event<{ value: any; name: string; flat?: boolean }>;

  onChangeFieldBrowser: EventCallable<{ event: React.SyntheticEvent; name: string; flat?: boolean }>;
  onFocusFieldBrowser: EventCallable<{ event: React.SyntheticEvent; name: string }>;
  onBlurFieldBrowser: EventCallable<{ event: React.SyntheticEvent; name: string }>;
  fieldInit: EventCallable<FieldInitParams>;

  getName: GetName<Values>;
  getNameStr: GetNameStr<Values>;

  name: string;
};

export type FieldArray<Values = any> = {
  form: Form<Values>;
  push: EventCallable<{ fieldName: string; value: any | any[] }>;
  remove: EventCallable<{ fieldName: string; index: number }>;
};

export type CreateFieldArrayParams<Values = any> = {
  form: Form<Values>;
  domain?: Domain;
};

// declare const useFieldArray: <Values extends AnyState = AnyState>(
//   paramsFieldArray: FieldArrayParams,
// ) => ResultUseFieldArray<Values>;
//
// declare const setIn: <O extends AnyState = AnyState, V = any>(
//   object: O,
//   path: string,
//   value: V,
// ) => O;
//
// declare const deleteIn: <O extends AnyState = AnyState>(
//   object: O,
//   path: string,
//   removeEmpty: boolean = false,
//   inDeep: boolean = true,
// ) => O;
//
// declare const getIn: <O extends AnyState = AnyState, V = any>(
//   object: O,
//   path: string,
//   removeEmpty: boolean = false,
//   inDeep: boolean = true,
// ) => V = any;
//
// declare const makeNested: <O extends AnyState = AnyState, R extends AnyState>(
//   inlineMap: O,
// ) => R;
//
// declare const removeFromInlineMap: <O extends FieldsInline = FieldsInline, R extends FieldsInline = FieldsInline>(
//   inlineMap: O,
//   key: string,
// ) => R;
