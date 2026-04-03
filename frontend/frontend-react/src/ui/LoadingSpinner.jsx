/**
 * ui/LoadingSpinner.jsx
 * Spinner hiển thị trong button và trang loading
 */
export function LoadingSpinner({ size = 'sm', color = 'white' }) {
    const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };
    const colors = {
        white: 'border-white/30 border-t-white',
        primary: 'border-primary/30 border-t-primary',
        gray: 'border-slate-200 border-t-slate-500',
    };

    return (
        <div
            className={`
        ${sizes[size]} rounded-full border-2 animate-spin flex-shrink-0
        ${colors[color]}
      `}
        />
    );
}