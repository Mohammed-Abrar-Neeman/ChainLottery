declare module 'qrcode' {
  function toDataURL(text: string): Promise<string>;
  function toDataURL(text: string, options: any): Promise<string>;
  function toString(text: string): Promise<string>;
  function toString(text: string, options: any): Promise<string>;
  
  export { toDataURL, toString };
}