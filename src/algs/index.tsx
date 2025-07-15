import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSettings, useLiveSettings } from "@/lib/settings";
import { useState } from "react";

export default function Algs() {
  const settings = useLiveSettings();

  const [cornerScheme, setCornerScheme] = useState(settings.cornerScheme);
  const [edgeScheme, setEdgeScheme] = useState(settings.edgeScheme);
  const [cornerBufferOrder, setCornerBufferOrder] = useState(settings.cornerBufferOrder);
  const [edgeBufferOrder, setEdgeBufferOrder] = useState(settings.edgeBufferOrder);
  
  const saveSettings = () => {
    updateSettings({
      cornerScheme,
      edgeScheme,
      cornerBufferOrder,
      edgeBufferOrder
    })
  }

  return (
    <div className='max-w-xl mx-auto space-y-5'>
      <h1 className='text-2xl'>Alg Settings</h1>
      <h2 className='text-xl'>Letter Schemes</h2>
      <div className="space-y-2">
        <p>
          Corner Letter scheme: UBL UBR UFR UFL LUB LUF LDF LDB FUL FUR FDR FDL RUF RBF RBD RFD BUR BUL BDL BDR DFL DFR DBR DBL
        </p>
        <Input value={cornerScheme} onChange={(e) => setCornerScheme(e.target.value)} />
      </div>
      <div className="space-y-2">
        <p>
          Edge Letter Scheme: UB UR UF UL LU LF LD LB FU FR FD FL RU RB RD RF BU BL BD BR DF DR DB DL
        </p>
        <Input value={edgeScheme} onChange={(e) => setEdgeScheme(e.target.value)} />
      </div>
      <div className="space-y-2">
        <p>
          Corner Buffer Order (include all corners)
        </p>
        <Input value={cornerBufferOrder} onChange={(e) => setCornerBufferOrder(e.target.value)} />
      </div>
      <div className="space-y-2">
        <p>
          Edge Buffer Order (include all edges)
        </p>
        <Input value={edgeBufferOrder} onChange={(e) => setEdgeBufferOrder(e.target.value)} />
      </div>
      <Button type="submit" onClick={saveSettings}>Save</Button>
    </div>
  );
}