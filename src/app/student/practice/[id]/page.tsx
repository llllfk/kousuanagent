import Practice from "../Practice";

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qid = Number(id);
  return <Practice id={Number.isInteger(qid) ? qid : 0} />;
}