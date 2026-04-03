/**
 * ui/InputField.jsx
 * Input có icon trái, toggle visibility (password), error state
 */
export function InputField({
    label,
    id,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    icon,           // Material Symbol name, ví dụ: 'mail'
    rightElement,   // JSX element ở bên phải (ví dụ: nút toggle password)
    className = '',
    ...props
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none select-none">
                        {icon}
                    </span>
                )}
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`
            w-full py-3 bg-slate-50 dark:bg-slate-800
            border rounded-lg text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 text-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all
            ${icon ? 'pl-10' : 'pl-4'}
            ${rightElement ? 'pr-11' : 'pr-4'}
            ${error
                            ? 'border-red-400 dark:border-red-500 focus:ring-red-400/30 focus:border-red-400'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-primary/20 focus:border-primary'
                        }
          `}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && (
                <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                </p>
            )}
        </div>
    );
}