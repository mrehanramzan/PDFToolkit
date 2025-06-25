interface LoadingOverlayProps {
  progress: number;
  message?: string;
}

export default function LoadingOverlay({ progress, message = "Processing..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 max-w-sm mx-4 text-center">
        <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
        <h3 className="font-semibold text-slate-900 mb-2">{message}</h3>
        <p className="text-slate-600 text-sm mb-4">This may take a few moments</p>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-500 mt-2">{Math.round(progress)}% complete</p>
      </div>
    </div>
  );
}
