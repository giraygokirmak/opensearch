export function sourceError(source, code, message) {
    return {
        source,
        code,
        message,
    };
}
export function failure(source, code, message) {
    return {
        source,
        results: [],
        error: sourceError(source, code, message),
    };
}
export function messageFromError(error) {
    if (error instanceof Error && error.message)
        return error.message;
    return String(error);
}
