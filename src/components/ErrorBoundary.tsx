import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  private handleResetAppState = () => {
    try {
      // Clear all lead sheet related localStorage items to wipe any corrupted state
      const keysToRemove = [
        'lead_sheet_songs',
        'lead_sheet_folders',
        'lead_sheet_current_song_id',
        'lead_sheet_active_screen',
        'lead_sheet_theme',
        'lead_sheet_accent_color',
        'lead_sheet_chord_font',
        'lead_sheet_notation_style',
        'lead_sheet_show_measure_numbers',
        'lead_sheet_selected_category',
        'lead_sheet_current_sub_view',
        'lead_sheet_repertoire_copied_slots'
      ];
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (_) {}
      });
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear local storage:", e);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col items-center justify-center p-6 font-sans">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200/80 p-8 shadow-[0_4px_30px_rgba(15,23,42,0.04)] flex flex-col gap-6">
            
            {/* Header section with Icon */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">
                  Application Encountered an Error
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  An unexpected issue occurred which prevented the sheet music studio from loading correctly.
                </p>
              </div>
            </div>

            {/* Error Message display */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col gap-2">
              <div className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Error Message
              </div>
              <div className="text-sm font-semibold font-mono text-red-600 break-words leading-relaxed">
                {this.state.error?.toString() || "Unknown rendering exception"}
              </div>
            </div>

            {/* Stack trace detail section if available */}
            {this.state.errorInfo && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 max-h-60 overflow-y-auto">
                <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                  Component Stack Trace
                </div>
                <pre className="text-[11px] font-mono text-slate-300 leading-normal whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            {/* Explanatory notice */}
            <p className="text-xs text-slate-500 leading-normal border-t border-slate-100 pt-4">
              <strong>Tip:</strong> If this error was caused by a corrupted local database save, clicking 
              <strong className="text-[#0c4a6e]"> Reset App State</strong> will safely clear your local cache, restore the default factory song library, and fix the issue.
            </p>

            {/* Interactive Actions Grid */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                id="error_reload_page_btn"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 cursor-pointer border border-transparent"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              
              <button
                id="error_reset_app_state_btn"
                onClick={this.handleResetAppState}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-[#0c4a6e] hover:bg-[#072f47] text-white shadow-md shadow-sky-900/10 transition active:scale-95 cursor-pointer border border-transparent"
              >
                <RotateCcw className="w-4 h-4" />
                Reset App State
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
