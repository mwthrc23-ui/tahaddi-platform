import { BarChart3, Plus, Trophy, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, StatisticCard, Table } from '@/components/ui';
import { competitions } from '@/mocks';
export default function Page() { return <DashboardLayout><div className="dashboard-actions"><Button><Plus />مسابقة جديدة</Button></div><div className="card-grid four"><StatisticCard title="المسابقات" meta="١٢" description="٣ مباشرة" /><StatisticCard title="اللاعبون" meta="٢٬٨٤٠" description="هذا الشهر" /><StatisticCard title="متوسط الدقة" meta="٧٨٪" description="+٤٪" /><StatisticCard title="الأسئلة" meta="٣٢٦" description="جاهزة للنشر" /></div><Card><h2><Trophy />آخر المسابقات</h2><Table headers={['المسابقة','الفئة','اللاعبون']} rows={competitions.map((item) => [item.title,item.category,item.players])} /></Card><div className="dashboard-empty"><Users /><BarChart3 /></div></DashboardLayout>; }
