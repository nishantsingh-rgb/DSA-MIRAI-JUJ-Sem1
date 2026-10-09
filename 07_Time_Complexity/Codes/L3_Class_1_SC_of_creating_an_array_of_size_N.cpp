#include <iostream>
using namespace std;

int main() {
    const int N = 5;
    int arr[N];

    for (int i = 0; i < N; i++) {
        arr[i] = (i + 1) * 10;
    }

    for (int i = 0; i < N; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;

    cout << "Array holds " << N << " ints = " << N * sizeof(int) << " bytes" << endl;
    cout << "Memory grows with N, so SC = O(N)" << endl;
    return 0;
}
