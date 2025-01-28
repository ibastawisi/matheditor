import { Box, Skeleton } from "@mui/material"

const ThumbnailSkeleton = () => {
  return (
    <Box className='document-thumbnail' sx={{ display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="text" width={150} height={40} sx={{ alignSelf: "center" }} />
      <Skeleton variant="text" width={100} height={20} sx={{ alignSelf: "start", my: 1 }} />
      <Skeleton variant="text" width={150} height={20} sx={{ alignSelf: "start", my: 1 }} />
      <Skeleton variant="text" width={120} height={20} sx={{ alignSelf: "start", my: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={100} sx={{ alignSelf: "center", my: 2 }} />
    </Box>
  );
}

export default ThumbnailSkeleton;