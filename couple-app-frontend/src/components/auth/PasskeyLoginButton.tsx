const PasskeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <title>Passkey Icon</title>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

export const PasskeyLoginButton = () => {
    const handlePasskeyLogin = () => {
        // TODO: Implement Passkey login logic
        console.log('Initiating Passkey login...');
    };

    return (
        <button
            onClick={handlePasskeyLogin}
            type="button"
            className="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
            <PasskeyIcon />
            <span className="ml-3">Sign in with a Passkey</span>
        </button>
    );
};