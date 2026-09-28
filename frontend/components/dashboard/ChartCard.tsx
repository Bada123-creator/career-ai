"use client";

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { month: "Jan", applications: 2 },
  { month: "Fév", applications: 4 },
  { month: "Mars", applications: 8 },
  { month: "Avr", applications: 12 },
  { month: "Mai", applications: 18 },
  { month: "Juin", applications: 25 },
];

export function ChartCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution des candidatures</CardTitle>
      </CardHeader>

      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="month" />
            <Tooltip />
            <Line
              dataKey="applications"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}