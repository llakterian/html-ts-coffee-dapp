interface Window {
  ethereum: {
    request: (args: {method: string; params?: any[]}) => Promise<any>;
    selectedAddress: string | null;
    isMetaMask?: boolean;
    on?: (event: string, callback: (...args: any[]) => void) => void;
  };
}
