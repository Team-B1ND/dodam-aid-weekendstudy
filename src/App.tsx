import { Component, useEffect, type ReactNode } from "react";
import { BridgeProvider } from "@b1nd/aid-kit/bridge-kit/web";
import { SafeAreaProvider } from "@b1nd/aid-kit/safe-area-provider";
import { AppStateProvider } from "@b1nd/aid-kit/app-state";
import { RouteProvider, Router } from "@b1nd/aid-kit/navigation";
import { AccessTokenBridge } from "./components/AccessTokenBridge";
import { PATHS } from "./routes";
import HomePage from "./pages/home";
import ApplicationsPage from "./pages/applications";
import RentalsPage from "./pages/rentals";
import HeadcountPage from "./pages/headcount";
import AttendanceCheckPage from "./pages/attendance";

const routes = {
    tabs: [{ path: PATHS.home, index: true, element: HomePage }],
    stacks: [
        { path: PATHS.applications, element: ApplicationsPage },
        { path: PATHS.rentals, element: RentalsPage },
        { path: PATHS.headcount, element: HeadcountPage },
        { path: PATHS.attendance, element: AttendanceCheckPage },
    ],
};

type EBProps = { children: ReactNode };
type EBState = { error: Error | null };

class ErrorBoundary extends Component<EBProps, EBState> {
    state: EBState = { error: null };

    static getDerivedStateFromError(error: Error): EBState {
        return { error };
    }

    render() {
        const { error } = this.state;
        if (error) {
            return (
                <pre
                    style={{
                        padding: 16,
                        fontSize: 12,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                    }}
                >
                    {String(error.stack ?? error.message ?? error)}
                </pre>
            );
        }
        return this.props.children;
    }
}

const ThemeApplier = () => {
    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const apply = () => {
            document.documentElement.setAttribute(
                "data-theme",
                media.matches ? "dark" : "light"
            );
        };

        apply();
        media.addEventListener("change", apply);

        return () => media.removeEventListener("change", apply);
    }, []);

    return null;
};

const App = () => (
    <ErrorBoundary>
        <BridgeProvider>
            <SafeAreaProvider>
                <AppStateProvider>
                    <ThemeApplier />
                    <AccessTokenBridge />
                    <RouteProvider routes={routes}>
                        <Router routes={routes} />
                    </RouteProvider>
                </AppStateProvider>
            </SafeAreaProvider>
        </BridgeProvider>
    </ErrorBoundary>
);

export default App;