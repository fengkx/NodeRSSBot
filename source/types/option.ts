// Option type inspried by Scala

export const none = Symbol('None');
export type None = symbol;

export interface Some<A> {
    readonly value: A;
}

export function isNone<A>(a: Option<A>): a is None {
    return a === none;
}

export function isSome<A>(a: Option<A>): a is Some<A> {
    return a !== none;
}

export function Optional<A>(value?: A): Option<A> {
    if (value !== undefined && value !== null) {
        return {
            value: value
        };
    } else {
        return none;
    }
}

export type Option<A> = Some<A> | None;
