package com.daohoangson.glowbabycharts.android;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import com.topjohnwu.superuser.io.SuFile;
import com.topjohnwu.superuser.io.SuFileInputStream;

import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;

import androidx.databinding.ObservableBoolean;
import androidx.databinding.ObservableField;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class DbFile {
    private final static String TAG = "DbFile";

    private final OkHttpClient client = new OkHttpClient()
            .newBuilder().followRedirects(false).build();

    @SuppressLint("SdCardPath")
    private final File file = new SuFile("/data/data/com.glow.android.baby/databases/baby.db");

    private final Handler handler = new Handler();

    @SuppressWarnings("WeakerAccess")
    public final ObservableBoolean uploadStarted = new ObservableBoolean(false);

    @SuppressWarnings("WeakerAccess")
    public final ObservableBoolean uploadCompleted = new ObservableBoolean(false);

    @SuppressWarnings("WeakerAccess")
    public final ObservableField<String> uploadedLocation = new ObservableField<>("");

    public long length() {
        return file.length();
    }

    public void open(View v) {
        String location = uploadedLocation.get();
        if (TextUtils.isEmpty(location)) {
            return;
        }

        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(location));
        v.getContext().startActivity(i);
    }

    public String path() {
        return file.getAbsolutePath();
    }

    public void share(View v) {
        String location = uploadedLocation.get();
        if (TextUtils.isEmpty(location)) {
            return;
        }

        Intent i = new Intent(Intent.ACTION_SEND);
        i.setType("text/plain");
        i.putExtra(Intent.EXTRA_TEXT, location);

        Context context = v.getContext();
        context.startActivity(Intent.createChooser(i, context.getString(R.string.share_verb)));
    }

    public void upload(View v) {
        if (!file.exists()) {
            return;
        }

        byte[] bytes = new byte[(int) file.length()];
        try {
            InputStream in = new SuFileInputStream(file);
            BufferedInputStream bis = new BufferedInputStream(in);
            DataInputStream dis = new DataInputStream(bis);
            dis.readFully(bytes);
        } catch (IOException e) {
            Toast.makeText(v.getContext(), e.getMessage(), Toast.LENGTH_LONG).show();
            e.printStackTrace();
            return;
        }

        uploadStarted.set(true);

        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("db", "baby.db", RequestBody.create(null, bytes))
                .build();

        Request request = new Request.Builder()
                .url("https://glow-baby-charts-master.daohoangson.now.sh/api/s3-deploy")
                .post(requestBody)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                handler.post(() -> Toast.makeText(v.getContext(), e.getMessage(), Toast.LENGTH_LONG).show());
                e.printStackTrace();
                uploadStarted.set(false);
            }

            @Override
            public void onResponse(Call call, Response response) {
                Log.i(TAG, String.format("response.code()=%d", response.code()));
                if (response.code() != 301) {
                    uploadStarted.set(false);
                    return;
                }

                String location = response.header("Location");
                Log.i(TAG, String.format("response.header[Location]=%s", location));
                if (TextUtils.isEmpty(location)) {
                    uploadStarted.set(false);
                    return;
                }

                uploadedLocation.set(location);
                uploadCompleted.set(true);
            }
        });
    }
}
