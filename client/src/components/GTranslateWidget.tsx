import { useEffect } from "react";

declare global {
  interface Window {
    gtranslateSettings?: any;
  }
}

export default function GTranslateWidget() {
  useEffect(() => {
    if (!document.getElementById("gtranslate-dropdown-script")) {
      // Set settings BEFORE loading the script
      window.gtranslateSettings = {
        default_language: "en",
        detect_browser_language: true,
        languages: ["en","es","mt","de","ko","ja","fr","it","ro","nl","pt","vi","tr","id","sl"],
        wrapper_selector: ".gtranslate_wrapper",
        horizontal_position: "left",
        vertical_position: "bottom"
      };

      const script = document.createElement("script");
      script.id = "gtranslate-dropdown-script";
      script.src = "https://cdn.gtranslate.net/widgets/latest/dropdown.js";
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return <div className="gtranslate_wrapper"></div>;
} 