import { ContentLayout } from '@/components/layout/ContentLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import React from 'react'

const AdminPage = () => {
  return (
    <ProtectedRoute roles={['admin']}>
      <ContentLayout title='Permisos'>PermisosPag</ContentLayout>
    </ProtectedRoute>
  )
}

export default AdminPage
