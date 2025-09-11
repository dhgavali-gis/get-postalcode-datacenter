import { useState, useMemo } from "react";
import { CheckIcon, Download, FileText, Loader2, AlertCircle, RefreshCw, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDatasets, useSampleFileStatus } from "@/hooks/useDatasets";

import { DatasetInfo } from "@/types/dataset";

export default function DatabaseCenter() {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const { toast } = useToast();
  const { data: datasets, loading, error, reload } = useDatasets();
  const { fileStatus, loading: fileStatusLoading } = useSampleFileStatus(datasets);

  // Get unique regions and filter datasets
  const { regions, filteredDatasets } = useMemo(() => {
    if (!datasets) return { regions: [], filteredDatasets: [] };

    const uniqueRegions = Array.from(new Set(datasets.map(d => d.region))).sort();
    const filtered = selectedRegion === "all"
      ? datasets
      : datasets.filter(d => d.region === selectedRegion);

    return { regions: uniqueRegions, filteredDatasets: filtered };
  }, [datasets, selectedRegion]);

  const handleSelectAll = () => {
    if (!filteredDatasets) return;

    // Only select filtered datasets with available files
    const availableDatasets = filteredDatasets.filter(d =>
      fileStatus.get(d.sampleFileName) !== false
    );

    if (selectedIds.size === availableDatasets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableDatasets.map(d => d.id)));
    }
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    // Clear selections when changing region filter
    setSelectedIds(new Set());
  };

  const handleSelectRow = (id: string | number) => {
    const dataset = filteredDatasets?.find(d => d.id === id);
    if (!dataset) return;

    // Don't allow selection of datasets with unavailable files
    if (fileStatus.get(dataset.sampleFileName) === false) {
      toast({
        title: "File Unavailable",
        description: `${dataset.sampleFileName} is not available for download`,
        variant: "destructive"
      });
      return;
    }

    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDownloadSample = async (dataset: DatasetInfo) => {
    try {
      toast({
        title: "Download Started",
        description: `Downloading ${dataset.sampleFileName}`,
      });

      // Use DataLoader to download the actual file
      const { DataLoader } = await import('@/lib/dataLoader');
      const blob = await DataLoader.downloadSampleFile(dataset.sampleFileName);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dataset.sampleFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `${dataset.sampleFileName} has been downloaded successfully`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: `Failed to download ${dataset.sampleFileName}. The file may not be available.`,
        variant: "destructive"
      });
    }
  };

  const handleDownloadSelected = async () => {
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

    // Download each selected dataset
    let successCount = 0;
    let failureCount = 0;

    for (const id of selectedIds) {
      const dataset = filteredDatasets?.find(d => d.id === id);
      if (dataset) {
        try {
          await handleDownloadSample(dataset);
          successCount++;
          // Add small delay between downloads to prevent overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          failureCount++;
          console.error(`Failed to download ${dataset.sampleFileName}:`, error);
        }
      }
    }

    // Show final status
    if (failureCount === 0) {
      toast({
        title: "Bulk Download Complete",
        description: `Successfully downloaded ${successCount} file(s)`,
      });
    } else {
      toast({
        title: "Bulk Download Completed with Errors",
        description: `Downloaded ${successCount} file(s), ${failureCount} failed`,
        variant: "destructive"
      });
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading postal code datasets...</p>
        </div>
      </div>
    );
  }

  if (error && !datasets) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold text-foreground">Failed to Load Datasets</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={reload} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!datasets || datasets.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">No Datasets Available</h2>
          <p className="text-muted-foreground">No postal code datasets are currently available.</p>
          <Button onClick={reload} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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
                {selectedIds.size} of {filteredDatasets.filter(d => fileStatus.get(d.sampleFileName) !== false).length} available selected
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
        {/* Error Banner */}
        {error && datasets && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  {error}
                </p>
              </div>
              <Button onClick={reload} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedRegion} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="text-sm"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              {(() => {
                const availableDatasets = filteredDatasets.filter(d =>
                  fileStatus.get(d.sampleFileName) !== false
                );
                return selectedIds.size === availableDatasets.length ? 'Deselect All' : 'Select All Available';
              })()}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredDatasets.length} of {datasets.length} datasets
            {selectedRegion !== "all" && (
              <span className="ml-2 text-primary">({selectedRegion})</span>
            )}
          </div>
        </div>

        {/* Data Table */}
        {filteredDatasets.length === 0 ? (
          <div className="bg-card rounded-lg shadow-md border border-border p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No datasets found</h3>
            <p className="text-muted-foreground">
              No datasets match the selected region filter. Try selecting a different region.
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-table-header border-b border-table-border sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <Checkbox
                        checked={(() => {
                          const availableDatasets = filteredDatasets.filter(d =>
                            fileStatus.get(d.sampleFileName) !== false
                          );
                          return selectedIds.size === availableDatasets.length && availableDatasets.length > 0;
                        })()}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Country Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Postal Code Count</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Region</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Sample File</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Last Updated</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Total Admin Boundaries</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Admin 1</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Admin 2</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Admin 3</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-table-border">
                  {filteredDatasets.map((dataset) => (
                    <tr
                      key={dataset.id}
                      className={`transition-colors hover:bg-hover-bg ${selectedIds.has(dataset.id) ? 'bg-selected-bg' : ''
                        }`}
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedIds.has(dataset.id)}
                          onCheckedChange={() => handleSelectRow(dataset.id)}
                          disabled={fileStatus.get(dataset.sampleFileName) === false}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </td>
                      <td  className="px-6 py-4 text-sm font-medium text-foreground">
                        {dataset.countryName}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                        {dataset.countryCode}
                      </td>
                        <td className="px-6 py-4 text-sm text-foreground font-semibold">
                          {/* {formatNumber(dataset.postalCodeCount)} */}
                          -
                        </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {dataset.region}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <span className={`${dataset.status === 'ready' ? 'bg-green-500 ' : 'bg-red-500'} text-white px-2 py-1 rounded-md`}>{dataset.status.toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4">
                        {fileStatusLoading ? (
                          <div className="flex items-center text-muted-foreground">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span className="text-sm">Checking...</span>
                          </div>
                        ) : fileStatus.get(dataset.sampleFileName) === false ? (
                          <div className="flex items-center text-muted-foreground">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm">{dataset.sampleFileName} (unavailable)</span>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadSample(dataset)}
                            className="text-primary hover:text-primary hover:bg-hover-bg"
                            disabled={fileStatus.get(dataset.sampleFileName) === false}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {dataset.sampleFileName}
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {dataset.lastUpdatedDate}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {/* {dataset.admin1Count}  */} - 
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {/* {dataset.admin1Count} */} -
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {/* {dataset.admin2Count} */} -
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {/* {dataset.admin3Count} */} -
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-2xl font-bold text-foreground">
              {filteredDatasets.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedRegion === "all" ? "Total Countries" : `Countries in ${selectedRegion}`}
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(filteredDatasets.reduce((acc, d) => acc + d.postalCodeCount, 0))}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedRegion === "all" ? "Total Postal Codes" : `Postal Codes in ${selectedRegion}`}
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-2xl font-bold text-foreground">
              {selectedRegion === "all" ? new Set(datasets.map(d => d.region)).size : 1}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedRegion === "all" ? "Regions Covered" : "Region Selected"}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}