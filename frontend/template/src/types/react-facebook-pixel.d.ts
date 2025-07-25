declare module 'react-facebook-pixel' {
  interface PixelOptions {
    autoConfig?: boolean;
    debug?: boolean;
    version?: string;
  }
  
  interface ReactFacebookPixel {
    init: (pixelId: string, advancedMatching?: object, options?: PixelOptions) => void;
    pageView: () => void;
    track: (event: string, data?: object) => void;
    trackSingle: (pixelId: string, event: string, data?: object) => void;
    trackCustom: (event: string, data?: object) => void;
    revokeConsent: () => void;
    grantConsent: () => void;
    fbq: (...args: any[]) => void;
  }
  
  const ReactPixel: ReactFacebookPixel;
  
  export default ReactPixel;
}
