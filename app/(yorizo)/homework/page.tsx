import { HomeworkClient } from "./HomeworkClient"

import { listHomework, type HomeworkTask } from "@/lib/api"

const USER_ID = "demo-user"

async function fetchHomework(): Promise<[HomeworkTask[], HomeworkTask[]]> {
  const [pending, done] = await Promise.all([
    listHomework(USER_ID, "pending").catch(() => [] as HomeworkTask[]),
    listHomework(USER_ID, "done").catch(() => [] as HomeworkTask[]),
  ])
  return [pending, done]
}

export default async function HomeworkPage() {
  const [pendingTasks, doneTasks] = await fetchHomework()
  return <HomeworkClient initialPending={pendingTasks} initialDone={doneTasks} />
}
