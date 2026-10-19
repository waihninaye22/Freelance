import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, type Job, type Page } from "~/lib/api"
import { useAuth } from "~/lib/auth"

const savedJobsKey = ["saved-jobs"] as const

export function useSavedJob(job: Job | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const savedJobs = useQuery({
    queryKey: savedJobsKey,
    queryFn: () => api.get<Page<Job>>("/saved-jobs?limit=100"),
    enabled: Boolean(user),
  })
  const isSaved = Boolean(job && savedJobs.data?.data.some((saved) => saved.id === job.id))

  const toggle = useMutation({
    mutationFn: (remove: boolean) => {
      if (!job) throw new Error("The job is not available.")
      return remove ? api.delete<void>(`/saved-jobs/${job.id}`) : api.put(`/saved-jobs/${job.id}`)
    },
    onMutate: async (remove) => {
      await queryClient.cancelQueries({ queryKey: savedJobsKey })
      const previous = queryClient.getQueryData<Page<Job>>(savedJobsKey)
      if (job && previous) {
        queryClient.setQueryData<Page<Job>>(savedJobsKey, (current) => {
          if (!current) return current
          const alreadyInList = current.data.some((saved) => saved.id === job.id)
          if (remove && !alreadyInList) return current
          if (!remove && alreadyInList) return current
          const limit = Math.max(current.pagination.limit, 1)
          const total = Math.max(0, current.pagination.total + (remove ? -1 : 1))
          return {
            ...current,
            data: remove
              ? current.data.filter((saved) => saved.id !== job.id)
              : [job, ...current.data].slice(0, limit),
            pagination: { ...current.pagination, total, pages: Math.ceil(total / limit) },
          }
        })
      }
      return { previous }
    },
    onError: (_error, _remove, context) => {
      if (context?.previous) queryClient.setQueryData(savedJobsKey, context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: savedJobsKey })
    },
  })

  return {
    isSaved,
    isPending: toggle.isPending,
    error: toggle.error,
    toggle: () => toggle.mutate(isSaved),
  }
}
