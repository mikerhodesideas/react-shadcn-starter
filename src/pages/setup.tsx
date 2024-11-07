// src/pages/setup.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Steps } from "@/components/ui/steps";
import { Copy, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { getGoogleAdsScript } from "@/lib/google-ads-script-template";
import { useNavigate } from 'react-router-dom';
import { DataService } from '@/services/data-service';
import { Progress } from "@/components/ui/progress";
import { DATA_SOURCES } from "@/lib/constants";

const TEMPLATE_URL = "https://docs.google.com/spreadsheets/d/1XmQYHWYbQbtn6mnrGYB71dsixbp66Eo3n5o7fka_s10/copy";

const SetupWizard = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [sheetUrl, setSheetUrl] = useState('');
    const [webAppUrl, setWebAppUrl] = useState('');
    const [isSheetUrlValid, setIsSheetUrlValid] = useState(false);
    const [isWebAppUrlValid, setIsWebAppUrlValid] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [setupComplete, setSetupComplete] = useState(false);
    const [scriptCopied, setScriptCopied] = useState(false);
    const { toast } = useToast();

    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const savedState = localStorage.getItem('setupState');
        if (savedState) {
            const { sheetUrl, webAppUrl, setupComplete, currentStep } = JSON.parse(savedState);
            setSheetUrl(sheetUrl || '');
            setWebAppUrl(webAppUrl || '');
            setSetupComplete(setupComplete || false);
            setCurrentStep(currentStep || 1);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('setupState', JSON.stringify({
            sheetUrl,
            webAppUrl,
            setupComplete,
            currentStep
        }));
    }, [sheetUrl, webAppUrl, setupComplete, currentStep]);

    const validateSheetUrl = (url) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === 'docs.google.com' &&
                urlObj.pathname.includes('/spreadsheets/d/');
        } catch {
            return false;
        }
    };

    const validateWebAppUrl = (url) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === 'script.google.com' &&
                urlObj.pathname.includes('/macros/s/') &&
                urlObj.pathname.includes('/exec');
        } catch {
            return false;
        }
    };

    const handleSheetUrlChange = (e) => {
        const url = e.target.value;
        setSheetUrl(url);
        setIsSheetUrlValid(validateSheetUrl(url));
    };

    const handleWebAppUrlChange = (e) => {
        const url = e.target.value;
        setWebAppUrl(url);
        setIsWebAppUrlValid(validateWebAppUrl(url));
    };

    const handleSetupComplete = async () => {
        localStorage.setItem('setupData', JSON.stringify({
            isComplete: true,
            sheetUrl,
            webAppUrl,
            completedAt: new Date().toISOString()
        }));
    
        try {
            await fetchAllData();
            toast({
                title: "Setup Complete",
                description: "Setup completed successfully. Taking you to settings...",
            });
            navigate('/settings');  // Navigate to settings after setup
        } catch (error) {
            console.error('Error during setup completion:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to complete setup. Please try again.",
            });
        }
    };

    const copyScript = async () => {
        try {
            const script = getGoogleAdsScript(sheetUrl);
            await navigator.clipboard.writeText(script);
            setScriptCopied(true);
            toast({
                title: "Success",
                description: "Script copied to clipboard",
            });
            setTimeout(() => setScriptCopied(false), 2000);
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to copy script",
            });
        }
    };

    const fetchTab = async (tab: string) => {
        setFetchStatus(prev => ({
            ...prev,
            [tab]: { isLoading: true }
        }))

        const url = `${GOOGLE_SHEET_URL}?tab=${tab}`
        console.log(`Fetching ${tab} data from:`, url)

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            setFetchStatus(prev => ({
                ...prev,
                [tab]: {
                    isLoading: false,
                    rowCount: Array.isArray(data) ? data.length : 0
                }
            }))

            return data
        } catch (error) {
            console.error(`Error fetching ${tab}:`, error)
            setFetchStatus(prev => ({
                ...prev,
                [tab]: {
                    isLoading: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch'
                }
            }))
            throw error
        }
    }

    const fetchAllData = async () => {
        setIsLoading(true)
        setError(null)
        setProgress(0)

        const totalTabs = Object.keys(DATA_SOURCES).length
        let completedTabs = 0

        try {
            const existingData = DataService.loadData() || {}
            const updatedData: Record<string, any> = { ...existingData }

            for (const [tab, source] of Object.entries(DATA_SOURCES)) {
                try {
                    const data = await fetchTab(tab)
                    if (data) {
                        updatedData[tab] = data
                    }
                    completedTabs++
                    setProgress((completedTabs / totalTabs) * 100)
                } catch (error) {
                    console.error(`Error fetching ${tab}:`, error)
                }
            }

            if (Object.keys(updatedData).length > 0) {
                updatedData.timestamp = new Date().toISOString()
                DataService.saveData(updatedData)
                refreshData()

                toast({
                    title: "Data Updated",
                    description: "Campaign data has been successfully refreshed.",
                })
            } else {
                throw new Error('No valid data received from any tab')
            }
        } catch (error) {
            console.error('Error in fetch process:', error)
            setError(error instanceof Error ? error.message : 'Failed to fetch data')
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to fetch data',
            })
        } finally {
            setIsLoading(false)
            setProgress(0)
        }
    }



    const renderStepOne = () => (
        <div className="space-y-4">
            <p className="text-base text-gray-600">First, create your copy of the template sheet and paste its URL below:</p>
            <Button
                onClick={() => window.open(TEMPLATE_URL, '_blank')}
                className="flex items-center space-x-2"
                variant={sheetUrl ? "completed" : "default"}
                disabled={sheetUrl}
            >
                <ExternalLink className="h-4 w-4" />
                <span>Create Sheet Copy</span>
            </Button>
            <div className="space-y-2">
                <Input
                    type="url"
                    value={sheetUrl}
                    onChange={handleSheetUrlChange}
                    placeholder="Paste your sheet URL here"
                    className="w-full"
                />
                {sheetUrl && !isSheetUrlValid && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Please enter a valid Google Sheets URL
                        </AlertDescription>
                    </Alert>
                )}
                <Button
                    className="w-full"
                    onClick={() => setCurrentStep(2)}
                    disabled={!isSheetUrlValid}
                >
                    Next Step
                </Button>
            </div>
        </div>
    );

    const renderStepTwo = () => (
        <div className="space-y-4">
            <p className="text-base text-gray-600">Copy and install the Google Ads script:</p>
            <div className="flex space-x-2">
                <Button
                    onClick={copyScript}
                    disabled={scriptCopied}
                    variant={scriptCopied ? "completed" : "default"}
                    className="flex items-center space-x-2"
                    size="lg"  // For larger text
                >
                    {scriptCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>Copy Script</span>
                </Button>
                <Button
                    variant="outline"
                    size="lg"  // For larger text
                    onClick={() => setShowInstructions(true)}
                >
                    View Instructions
                </Button>
            </div>
            <Button
                className="w-full"
                size="lg"  // For larger text
                variant={scriptCopied ? "default" : "secondary"}  // Only show full color if script is copied
                onClick={() => setCurrentStep(3)}
                disabled={!scriptCopied}  // Disable until script is copied
            >
                I've Installed the Script
            </Button>
        </div>
    );
    
    const renderStepThree = () => (
        <div className="space-y-4">
            <p className="text-base text-gray-600">Deploy your sheet as a Web App:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open your copied sheet</li>
                <li>Click Extensions → Apps Script</li>
                <li>Click Deploy → New deployment</li>
                <li>Select "Web app" as the type</li>
                <li>Set access to "Anyone"</li>
                <li>Click "Deploy"</li>
                <li>Authorize the app in the popup window</li>
                <li>Copy the Web App URL</li>
            </ol>
            <div className="space-y-2">
                <div className="p-4 border-2 border-brand rounded-lg bg-brand/5">
                    <Input
                        type="url"
                        value={webAppUrl}
                        onChange={handleWebAppUrlChange}
                        placeholder="Paste Web App URL here"
                        className="w-full h-14 text-lg px-4 border-2 border-brand placeholder:text-gray-400 placeholder:text-lg focus:ring-brand focus:border-brand"
                    />
                </div>
                {webAppUrl && !isWebAppUrlValid && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-lg">
                            Please enter a valid Google Apps Script Web App URL
                        </AlertDescription>
                    </Alert>
                )}
    
                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSetupComplete}
                    disabled={!isWebAppUrlValid}
                    variant={isWebAppUrlValid ? "default" : "secondary"}
                >
                    Complete Setup
                </Button>
            </div>
        </div>
    );

    const wizardSteps = [
        {
            title: "Create Sheet Copy",
            description: currentStep === 1 ? renderStepOne() : null
        },
        {
            title: "Install Script",
            description: currentStep === 2 ? renderStepTwo() : null
        },
        {
            title: "Deploy Web App",
            description: currentStep === 3 ? renderStepThree() : null
        }
    ];

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Setup Wizard</CardTitle>
                <CardDescription>Configure your Google Ads data integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Steps
                    steps={wizardSteps}
                    currentStep={currentStep}
                />

                <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
                    <DialogContent>
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Installing the Google Ads Script</h2>
                            <p className="text-sm text-gray-600">
                                Follow these steps to install and schedule the script:
                            </p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Go to your Google Ads account</li>
                                <li>Click Tools & Settings → Bulk Actions → Scripts</li>
                                <li>Click the + button to create a new script</li>
                                <li>Paste the copied script code</li>
                                <li>Click Save and authorize the script</li>
                                <li>Click Preview to test the script</li>
                                <li>Schedule the script to run hourly</li>
                            </ol>
                            <DialogClose asChild>
                                <Button className="w-full">Close</Button>
                            </DialogClose>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default SetupWizard;