<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@cubbyjs/react](./react.md) &gt; [WithCubbyState](./react.withcubbystate.md)

## WithCubbyState type

<b>Signature:</b>

```typescript
export declare type WithCubbyState<Props, Stores extends Record<string, {
    initialize: (init: any) => void;
}>> = Props & {
    cubbyState: InitialState<Stores>;
};
```
<b>References:</b> [InitialState](./react.initialstate.md)
