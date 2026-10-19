UPDATE "Notification" AS n
SET
  "href" = (
    SELECT '/jobs/' || j."id" || '/proposals'
    FROM "Proposal" AS p
    JOIN "Job" AS j ON j."id" = p."jobId"
    WHERE j."clientId" = n."userId"
      AND n."message" LIKE '%' || j."title" || '%'
    ORDER BY p."createdAt" DESC
    LIMIT 1
  ),
  "message" = (
    SELECT f."name" || ' submitted a proposal for “' || j."title" || '”.'
    FROM "Proposal" AS p
    JOIN "Job" AS j ON j."id" = p."jobId"
    JOIN "User" AS f ON f."id" = p."freelancerId"
    WHERE j."clientId" = n."userId"
      AND n."message" LIKE '%' || j."title" || '%'
    ORDER BY p."createdAt" DESC
    LIMIT 1
  )
WHERE n."type" = 'proposal_received'
  AND n."href" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "Proposal" AS p
    JOIN "Job" AS j ON j."id" = p."jobId"
    WHERE j."clientId" = n."userId"
      AND n."message" LIKE '%' || j."title" || '%'
  );

UPDATE "Notification" AS n
SET
  "href" = (
    SELECT '/jobs/' || j."id" || '/proposals'
    FROM "Proposal" AS p
    JOIN "Job" AS j ON j."id" = p."jobId"
    WHERE j."clientId" = n."userId"
      AND p."status" <> 'withdrawn'
    ORDER BY p."createdAt" DESC
    LIMIT 1
  ),
  "message" = (
    SELECT f."name" || ' submitted a proposal for “' || j."title" || '”.'
    FROM "Proposal" AS p
    JOIN "Job" AS j ON j."id" = p."jobId"
    JOIN "User" AS f ON f."id" = p."freelancerId"
    WHERE j."clientId" = n."userId"
      AND p."status" <> 'withdrawn'
    ORDER BY p."createdAt" DESC
    LIMIT 1
  )
WHERE n."type" = 'proposal_received'
  AND n."href" IS NULL
  AND n."message" LIKE 'Sample notification %'
  AND EXISTS (
    SELECT 1
    FROM "Proposal" AS p
    JOIN "Job" AS j ON j."id" = p."jobId"
    WHERE j."clientId" = n."userId"
      AND p."status" <> 'withdrawn'
  );
