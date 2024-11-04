import { PageHeader, PageHeaderHeading } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
    return (
        <>
            <PageHeader>
                <PageHeaderHeading>Start Here</PageHeaderHeading>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>Google Ads Data Viewer</CardTitle>
                    <CardDescription>A tool to view and analyze Google Ads data.</CardDescription>
                </CardHeader>
            </Card>
        </>
    )
}
