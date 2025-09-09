import { useState, useEffect } from "react";
import { CheckIcon, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface DatasetInfo {
  id: string;
  countryName: string;
  countryCode: string;
  postalCodeCount: number;
  region: string;
  status: string;
  sampleFileName: string;
}

const SAMPLE_DATASETS: DatasetInfo[] = [
  {
    id: "us",
    countryName: "United States",
    countryCode: "US",
    postalCodeCount: 41692,
    region: "North America",
    status: "active",
    sampleFileName: "us-postal-codes-sample.csv"
  },
  {
    id: "de",
    countryName: "Germany", 
    countryCode: "DE",
    postalCodeCount: 16475,
    region: "Europe",
    status: "active",
    sampleFileName: "de-postal-codes-sample.csv"
  },
  {
    id: "jp",
    countryName: "Japan",
    countryCode: "JP", 
    postalCodeCount: 15040,
    region: "Asia",
    status: "active",
    sampleFileName: "jp-postal-codes-sample.csv"
  },
  {
    id: "gb",
    countryName: "United Kingdom",
    countryCode: "GB",
    postalCodeCount: 28851,
    region: "Europe",   
    status: "active",
    sampleFileName: "gb-postal-codes-sample.csv"
  },
  {
    id: "fr",
    countryName: "France",
    countryCode: "FR",
    postalCodeCount: 36684,
    region: "Europe",
    status: "active",
    sampleFileName: "fr-postal-codes-sample.csv"
  },
  {
    id: "ca",
    countryName: "Canada",
    countryCode: "CA",
    postalCodeCount: 876445,
    region: "North America",
    status: "active",
    sampleFileName: "ca-postal-codes-sample.csv"
  }
];

export default function DatabaseCenter() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectAll = () => {
    if (selectedIds.size === SAMPLE_DATASETS.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(SAMPLE_DATASETS.map(d => d.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDownloadSample = (dataset: DatasetInfo) => {
    // Simulate file download
    toast({
      title: "Download Started",
      description: `Downloading ${dataset.sampleFileName}`,
    });
    
    // Create a simple CSV content for demo
    const csvContent = `Country,Code,PostalCode,Region\n${dataset.countryName},${dataset.countryCode},12345,Sample Region\n${dataset.countryName},${dataset.countryCode},67890,Sample Region 2`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dataset.sampleFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSelected = () => {
    if (selectedIds.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one dataset to download.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Bulk Download Started", 
      description: `Downloading ${selectedIds.size} dataset(s)`,
    });

    // Simulate bulk download
    selectedIds.forEach(id => {
      const dataset = SAMPLE_DATASETS.find(d => d.id === id);
      if (dataset) {
        setTimeout(() => handleDownloadSample(dataset), Math.random() * 1000);
      }
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading postal code datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Database Center</h1>
              <p className="text-muted-foreground mt-1">Postal code dataset statistics and downloads</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                {selectedIds.size} of {SAMPLE_DATASETS.length} selected
              </div>
              {selectedIds.size > 0 && (
                <Button onClick={handleDownloadSelected} className="bg-gradient-primary">
                  <Download className="w-4 h-4 mr-2" />
                  Download Selected ({selectedIds.size})
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="text-sm"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              {selectedIds.size === SAMPLE_DATASETS.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Total datasets: {SAMPLE_DATASETS.length}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-table-header border-b border-table-border">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <Checkbox
                      checked={selectedIds.size === SAMPLE_DATASETS.length && SAMPLE_DATASETS.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Country Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Postal Code Count</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Region</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Sample File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-table-border">
                {SAMPLE_DATASETS.map((dataset) => (
                  <tr
                    key={dataset.id}
                    className={`transition-colors hover:bg-hover-bg ${
                      selectedIds.has(dataset.id) ? 'bg-selected-bg' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedIds.has(dataset.id)}
                        onCheckedChange={() => handleSelectRow(dataset.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {dataset.countryName}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                      {dataset.countryCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {formatNumber(dataset.postalCodeCount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {dataset.region}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadSample(dataset)}
                        className="text-primary hover:text-primary hover:bg-hover-bg"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {dataset.sampleFileName}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-2xl font-bold text-foreground">
              {SAMPLE_DATASETS.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Countries</div>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(SAMPLE_DATASETS.reduce((acc, d) => acc + d.postalCodeCount, 0))}
            </div>
            <div className="text-sm text-muted-foreground">Total Postal Codes</div>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-2xl font-bold text-foreground">
              {new Set(SAMPLE_DATASETS.map(d => d.region)).size}
            </div>
            <div className="text-sm text-muted-foreground">Regions Covered</div>
          </div>
        </div>
      </main>
    </div>
  );
}