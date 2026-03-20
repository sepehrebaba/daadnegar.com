{{/*
Expand the name of the chart.
*/}}
{{- define "daadnegar-chart.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "daadnegar-chart.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "daadnegar-chart.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "daadnegar-chart.labels" -}}
helm.sh/chart: {{ include "daadnegar-chart.chart" . }}
{{ include "daadnegar-chart.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "daadnegar-chart.selectorLabels" -}}
app.kubernetes.io/name: {{ include "daadnegar-chart.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "daadnegar-chart.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "daadnegar-chart.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Shared env list entries for Next.js app containers (main web + admin-only).
Use under `env:` with: {{- include "daadnegar-chart.appEnv" . | nindent 12 }}
*/}}
{{- define "daadnegar-chart.appEnv" -}}
{{- if .Values.database.enabled }}
- name: DATABASE_HOST
  value: {{ include "daadnegar-chart.fullname" . }}-mysql
- name: DATABASE_PORT
  value: "3306"
- name: DATABASE_USER
  valueFrom:
    secretKeyRef:
      name: {{ .Values.database.existingSecret | default (printf "%s-mysql" (include "daadnegar-chart.fullname" .)) }}
      key: mysql-user
- name: DATABASE_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.database.existingSecret | default (printf "%s-mysql" (include "daadnegar-chart.fullname" .)) }}
      key: mysql-password
- name: DATABASE_NAME
  valueFrom:
    secretKeyRef:
      name: {{ .Values.database.existingSecret | default (printf "%s-mysql" (include "daadnegar-chart.fullname" .)) }}
      key: mysql-database
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ .Values.database.existingSecret | default (printf "%s-mysql" (include "daadnegar-chart.fullname" .)) }}
      key: mysql-url
{{- end }}
{{- if .Values.minio.enabled }}
- name: MINIO_ENDPOINT
  value: {{ include "daadnegar-chart.fullname" . }}-minio
- name: MINIO_PORT
  value: "9000"
- name: MINIO_USE_SSL
  value: "false"
- name: MINIO_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: {{ .Values.minio.existingSecret | default (printf "%s-minio-secrets" (include "daadnegar-chart.fullname" .)) }}
      key: MINIO_ROOT_USER
- name: MINIO_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: {{ .Values.minio.existingSecret | default (printf "%s-minio-secrets" (include "daadnegar-chart.fullname" .)) }}
      key: MINIO_ROOT_PASSWORD
- name: MINIO_BUCKET
  value: "daadnegar-uploads"
{{- end }}
{{- if .Values.rabbitmq.enabled }}
- name: RABBITMQ_URL
  valueFrom:
    secretKeyRef:
      name: {{ .Values.rabbitmq.existingSecret | default (printf "%s-rabbitmq" (include "daadnegar-chart.fullname" .)) }}
      key: RABBITMQ_URL
{{- end }}
{{- range $key, $val := .Values.env }}
- name: {{ $key }}
  value: {{ $val | quote }}
{{- end }}
{{- end }}
